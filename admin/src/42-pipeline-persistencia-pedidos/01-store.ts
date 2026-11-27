import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews, type ViewId } from '@/00-director-acceso'
import { formatShortISO, todayISO } from '@/71-pipeline-seleccion-fechas/05-date'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { expiredReservations } from '../38-pipeline-reserva-pedidos/04-reservation'
import { findOrderByQuote, ordersOfChannel } from './02-order.service'
import { applyStatusLabels, canTransition, deleteBlockedReason, editBlockedReason, ORDER_STATUSES, statusOf, type StatusLabel, type StatusLabels } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import {
  changeOrderStatusApi,
  createOrderApi,
  deleteChannelApi,
  deleteOrderApi,
  fetchChannels,
  fetchOrderApi,
  fetchOrders,
  fetchStatusLabels,
  reserveOrderApi,
  saveChannelApi,
  saveStatusLabelApi,
  setChannelActiveApi,
  updateOrderApi,
} from './06-pedidos.api'
import type { Channel, ChannelDraft, DeletedOrder, Order, OrderDraft, OrderStatusId } from './05-types'

/**
 * Store de ventas. Desde L13 la fuente de pedidos, canales y etiquetas de estado es la API; esto es su
 * caché. Reservar (L14) aparta el stock en el servidor; facturar y anular (L15) también ocurren allí, y
 * Facturación relee el pedido con `refreshOrder`.
 */
interface SalesState {
  /** Pedidos vigentes: lo único que leen listados, métricas, stock y facturación. */
  orders: Order[]
  /** Papelera de auditoría: desde L13 la conserva el servidor (eliminación lógica); aquí queda vacía. */
  deletedOrders: DeletedOrder[]
  channels: Channel[]
  /** Nombres/descripciones personalizados de los estados del flujo (lo demás es fijo). */
  statusLabels: StatusLabels
  isLoading: boolean
  /** Registra el pedido en estado "Registrado". Lanza error si la cotización ya se convirtió. */
  addOrder: (draft: OrderDraft, by: string) => Promise<Order>
  /**
   * Reemplaza los datos editables de un pedido sin factura (ver `editBlockedReason`).
   * Conserva id, fecha, estado, cotización e historial; recalcula el total y deja rastro.
   */
  updateOrder: (orderId: string, draft: OrderDraft, by: string) => Promise<Order>
  /**
   * Eliminación LÓGICA: el pedido sale de `orders` y se conserva en `deletedOrders`
   * con quién, cuándo y por qué. Lanza error si tiene factura (ver `deleteBlockedReason`).
   */
  deleteOrder: (orderId: string, by: string, reason: string) => DeletedOrder
  /**
   * "Confirmar y reservar": Registrado → Reservado con vigencia hasta `until` (YYYY-MM-DD).
   * Lo decide el servidor (stock y fecha); lanza su error si no procede.
   */
  reserve: (orderId: string, until: string) => Promise<Order>
  /**
   * Refleja en la caché las reservas vencidas: el pedido vuelve a Registrado (acción del sistema).
   * Quien libera el stock es el servidor (barrido y vencimiento en línea, L14). Devuelve los ids afectados.
   */
  expireReservations: (today?: string) => string[]
  /** Aplica una transición válida del flujo. Devuelve `false` si no está permitida. */
  transition: (orderId: string, to: OrderStatusId, by: string, note?: string) => boolean
  /**
   * Relee el pedido del servidor y reemplaza la caché (L15): tras emitir (→ Facturado) o anular la factura
   * (→ Reservado hasta hoy + 3), que el servidor aplica en la misma transacción que la factura.
   */
  refreshOrder: (orderId: string) => Promise<void>
  /** Alterna el canal y devuelve su nuevo estado. */
  toggleChannel: (channelId: string) => Channel | undefined
  /** Crea o edita. Renombrar actualiza el canal en sus pedidos (guardan el nombre). */
  saveChannel: (draft: ChannelDraft) => Promise<'created' | 'updated'>
  /** Solo canales sin pedidos (regla en `channelDeleteBlock`). */
  deleteChannel: (channelId: string) => void
  updateStatusLabel: (statusId: OrderStatusId, label: StatusLabel) => void
  reset: () => void
}

const stamp = (order: Order, status: OrderStatusId, by: string, note?: string): Order => ({
  ...order,
  status,
  history: [...order.history, { status, at: new Date().toISOString(), by, ...(note ? { note } : {}) }],
})

const patchOrder = (orders: Order[], id: string, fn: (o: Order) => Order) => orders.map((o) => (o.id === id ? fn(o) : o))

/**
 * Versión del esquema persistido.
 * v1: estados en texto libre, una sola línea · v2: flujo tipado, cliente enlazado, descuentos, historial
 * · v3: cargos extra (`charges`) · v4: reserva con vigencia (`reservedUntil`)
 * · v5 (L13): pedidos, canales y etiquetas viven en la API; toda caché anterior era de demostración.
 */
const SALES_SCHEMA_VERSION = 5

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** Id del canal elegido (el constructor lo maneja por nombre). */
function channelIdOf(channels: Channel[], name: string): number {
  const channel = channels.find((c) => c.name === name)
  if (!channel) throw new Error('Selecciona un canal de venta válido.')
  return Number(channel.id)
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      orders: [],
      deletedOrders: [],
      channels: [],
      statusLabels: {},
      isLoading: false,

      addOrder: async (draft) => {
        // Regla: una cotización se convierte en un solo pedido activo (el enlace en la API llega en L16).
        if (draft.quoteId && findOrderByQuote(get().orders, draft.quoteId)) {
          throw new Error(`La cotización ${draft.quoteId} ya tiene un pedido activo.`)
        }
        set({ isLoading: true })
        try {
          const order = await createOrderApi(draft, channelIdOf(get().channels, draft.channel))
          set((s) => ({ orders: [order, ...s.orders], isLoading: false }))
          return order
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      updateOrder: async (orderId, draft) => {
        const blocked = editBlockedReason(get().orders.find((o) => o.id === orderId))
        if (blocked) throw new Error(blocked)
        set({ isLoading: true })
        try {
          // El servidor vuelve a comprobar la regla con el pedido bloqueado.
          const updated = await updateOrderApi(orderId, draft, channelIdOf(get().channels, draft.channel))
          set((s) => ({ orders: patchOrder(s.orders, orderId, () => updated), isLoading: false }))
          return updated
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteOrder: (orderId, by, reason) => {
        const { orders } = get()
        const index = orders.findIndex((o) => o.id === orderId)
        const order = orders[index]
        const blocked = deleteBlockedReason(order)
        if (blocked || !order) throw new Error(blocked ?? 'El pedido no existe.')
        const deleted: DeletedOrder = {
          ...order,
          deletedAt: new Date().toISOString(),
          deletedBy: by,
          deleteReason: reason,
          history: [...order.history, { status: order.status, at: new Date().toISOString(), by, note: `Pedido eliminado · ${reason}` }],
        }
        // Optimista: sale de la lista ya; si la API falla, vuelve a su lugar y se avisa.
        set({ orders: orders.filter((o) => o.id !== orderId) })
        deleteOrderApi(orderId, reason).catch((error: unknown) => {
          set((s) => ({ orders: [...s.orders.slice(0, index), order, ...s.orders.slice(index)] }))
          toast(`No se eliminó el pedido ${order.id}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
        return deleted
      },

      reserve: async (orderId, until) => {
        set({ isLoading: true })
        try {
          const reserved = await reserveOrderApi(orderId, until)
          set((s) => ({ orders: patchOrder(s.orders, orderId, () => reserved), isLoading: false }))
          return reserved
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      expireReservations: (today = todayISO()) => {
        const expired = expiredReservations(get().orders, today).map((o) => o.id)
        if (expired.length === 0) return []
        set((s) => ({
          orders: s.orders.map((o) =>
            expired.includes(o.id)
              ? stamp({ ...o, reservedUntil: null }, 'registrado', 'Sistema', `Reserva vencida (${formatShortISO(o.reservedUntil)}): stock liberado`)
              : o,
          ),
        }))
        return expired
      },

      transition: (orderId, to, by, note) => {
        const order = get().orders.find((o) => o.id === orderId)
        // "Facturado" solo se alcanza al emitir la factura (Facturación) y "Reservado" con
        // `reserve` (requiere vigencia); nunca por esta vía.
        if (!order || (to !== 'cancelado' && to !== 'entregado') || !canTransition(order.status, to)) return false
        // Optimista: el servidor decide (422 si ya no procede) y su respuesta reemplaza la caché.
        set((s) => ({ orders: patchOrder(s.orders, orderId, (o) => stamp({ ...o, reservedUntil: null }, to, by, note)) }))
        changeOrderStatusApi(orderId, to, note)
          .then((saved) => set((s) => ({ orders: patchOrder(s.orders, orderId, () => saved) })))
          .catch((error: unknown) => {
            set((s) => ({ orders: patchOrder(s.orders, orderId, () => order) }))
            toast(`No se cambió el pedido ${order.id} a "${statusOf(to).name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
        return true
      },

      refreshOrder: async (orderId) => {
        const saved = await fetchOrderApi(orderId)
        set((s) => ({ orders: patchOrder(s.orders, orderId, () => saved) }))
      },

      toggleChannel: (channelId) => {
        const current = get().channels.find((c) => c.id === channelId)
        if (!current) return undefined
        const active = !current.active
        set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, active } : c)) }))
        setChannelActiveApi(channelId, active)
          .then((saved) => set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? saved : c)) })))
          .catch((error: unknown) => {
            set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? current : c)) }))
            toast(`No se cambió el canal "${current.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
        return { ...current, active }
      },

      saveChannel: async (draft) => {
        set({ isLoading: true })
        try {
          const previous = draft.id ? get().channels.find((c) => c.id === draft.id) : undefined
          const saved = await saveChannelApi({ ...draft, id: previous?.id })
          const renamed = previous && previous.name !== saved.name ? previous.name : null
          set((s) => ({
            isLoading: false,
            channels: previous ? s.channels.map((c) => (c.id === saved.id ? saved : c)) : [...s.channels, saved],
            // Los pedidos muestran el nombre actual del canal (el servidor lo resuelve por la FK).
            orders: renamed ? s.orders.map((o) => (o.channel === renamed ? { ...o, channel: saved.name } : o)) : s.orders,
          }))
          return previous ? 'updated' : 'created'
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteChannel: (channelId) => {
        const { channels, orders } = get()
        const index = channels.findIndex((c) => c.id === channelId)
        const channel = channels[index]
        if (!channel) return
        if (ordersOfChannel(orders, channel).length > 0) throw new Error('El canal tiene pedidos registrados.')
        // Optimista; el servidor responde 409 si tiene pedidos (también eliminados).
        set({ channels: channels.filter((c) => c.id !== channelId) })
        deleteChannelApi(channelId).catch((error: unknown) => {
          set((s) => ({ channels: [...s.channels.slice(0, index), channel, ...s.channels.slice(index)] }))
          toast(`No se eliminó el canal "${channel.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      updateStatusLabel: (statusId, label) => {
        const previous = get().statusLabels
        const next = { name: label.name.trim(), description: label.description.trim() }
        const statusLabels = { ...previous, [statusId]: next }
        applyStatusLabels(statusLabels)
        set({ statusLabels })
        saveStatusLabelApi(statusId, next).catch((error: unknown) => {
          applyStatusLabels(previous)
          set({ statusLabels: previous })
          toast(`No se guardó el estado "${next.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      // Mantenimiento: se relee de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadSales()
      },
    }),
    {
      name: STORAGE_KEYS.SALES,
      partialize: (s) => ({ orders: s.orders, channels: s.channels, statusLabels: s.statusLabels }),
      // Los textos personalizados del flujo se aplican a `statusOf` al cargar.
      onRehydrateStorage: () => (state) => applyStatusLabels(state?.statusLabels ?? {}),
      version: SALES_SCHEMA_VERSION,
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ orders: [] as Order[], channels: [] as Channel[], statusLabels: {} as StatusLabels }),
    },
  ),
)

/** Vistas que la API acepta para leer cada recurso (las que lo usan). */
const ORDER_VIEWS: ViewId[] = ['pedidos', 'tablero', 'facturacion', 'clientes', 'cotizaciones']
const CHANNEL_VIEWS: ViewId[] = ['pedidos', 'ajustes', 'tablero']
const LABEL_VIEWS: ViewId[] = [...ORDER_VIEWS, 'ajustes']

async function loadInto(views: ViewId[], what: string, load: () => Promise<void>): Promise<void> {
  if (!getCurrentViews().some((view) => views.includes(view))) return
  try {
    await load()
  } catch (error) {
    toast(`No se pudieron cargar ${what}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

/**
 * Precarga (al iniciar o restaurar la sesión): pedidos, canales y etiquetas de estado, cada uno solo
 * si el usuario tiene alguna vista que lo usa (sin ellas no se pide nada ni se avisa).
 */
async function loadSales(): Promise<void> {
  await Promise.all([
    loadInto(LABEL_VIEWS, 'los estados de pedido', async () => {
      const statusLabels = await fetchStatusLabels()
      applyStatusLabels(statusLabels)
      useSalesStore.setState({ statusLabels })
    }),
    loadInto(CHANNEL_VIEWS, 'los canales de venta', async () => {
      useSalesStore.setState({ channels: await fetchChannels() })
    }),
    loadInto(ORDER_VIEWS, 'los pedidos', async () => {
      useSalesStore.setState({ orders: await fetchOrders() })
    }),
  ])
}

onAuthenticated(() => void loadSales())

/**
 * Usado por Facturación tras emitir o anular una factura (L15): relee el pedido del servidor. Si la lectura
 * falla, se avisa; la factura ya quedó guardada y la siguiente precarga corrige la caché.
 */
export const refreshOrder = (orderId: string): Promise<void> =>
  useSalesStore
    .getState()
    .refreshOrder(orderId)
    .catch((error: unknown) => toast(`No se pudo actualizar el pedido ${orderId}: ${errorMessage(error, 'error del servidor.')}`, 'warning'))

export const findOrder = (orderId: string): Order | undefined =>
  useSalesStore.getState().orders.find((o) => o.id === orderId)

/** Lecturas fuera de React para otros features (respaldo y restablecimiento). */
export const getSalesSnapshot = () => {
  const { orders, deletedOrders, channels } = useSalesStore.getState()
  // El respaldo incluye la papelera: la eliminación es lógica y debe poder auditarse.
  return { orders, deletedOrders, orderStatuses: ORDER_STATUSES, channels }
}

export const resetSales = (): void => useSalesStore.getState().reset()
