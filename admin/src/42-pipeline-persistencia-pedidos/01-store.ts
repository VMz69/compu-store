import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatShortISO, todayISO } from '@/71-pipeline-seleccion-fechas/05-date'
import { delay } from '@/84-pipeline-persistencia-demo/04-delay'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { slugify } from '@/85-pipeline-identificadores-texto/00-director-identificadores-texto'
import { orderTotals } from '../43-pipeline-reglas-pedidos/04-charges'
import { migrateOrder } from './03-migrate'
import { expiredReservations, reservationBounds, validateReservationDate } from '../38-pipeline-reserva-pedidos/04-reservation'
import { findOrderByQuote, nextOrderId, nowStamp, ordersOfChannel } from './02-order.service'
import { applyStatusLabels, canTransition, deleteBlockedReason, editBlockedReason, ORDER_STATUSES, type StatusLabel, type StatusLabels } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import { CHANNELS_MOCK } from '../88-pipeline-datos-demo-documentos/02-channels.mock'
import { ORDERS_MOCK } from '../88-pipeline-datos-demo-documentos/00-director-datos-demo-documentos'
import type { Channel, ChannelDraft, DeletedOrder, Order, OrderDraft, OrderStatusId } from './05-types'

interface SalesState {
  /** Pedidos vigentes: lo único que leen listados, métricas, stock y facturación. */
  orders: Order[]
  /** Papelera de auditoría (eliminación lógica): nunca se muestran ni se cuentan. */
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
   * Lanza error si la transición o la fecha no son válidas.
   */
  reserve: (orderId: string, until: string, by: string) => void
  /**
   * Libera las reservas vencidas: el pedido vuelve a Registrado (acción del sistema).
   * Devuelve los ids afectados.
   */
  expireReservations: (today?: string) => string[]
  /** Aplica una transición válida del flujo. Devuelve `false` si no está permitida. */
  transition: (orderId: string, to: OrderStatusId, by: string, note?: string) => boolean
  /** Vincula la factura (→ Facturado) o la desvincula al anularla (→ Reservado con vigencia por defecto). */
  setInvoice: (orderId: string, invoiceId: string | null, by: string) => void
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
 * · v3: cargos extra (`charges`) · v4: reserva con vigencia (`reservedUntil`).
 */
const SALES_SCHEMA_VERSION = 4

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      orders: ORDERS_MOCK,
      deletedOrders: [],
      channels: CHANNELS_MOCK,
      statusLabels: {},
      isLoading: false,

      addOrder: async (draft, by) => {
        // Regla: una cotización se convierte en un solo pedido activo.
        if (draft.quoteId && findOrderByQuote(get().orders, draft.quoteId)) {
          throw new Error(`La cotización ${draft.quoteId} ya tiene un pedido activo.`)
        }
        set({ isLoading: true })
        await delay()
        const base: Order = {
          ...draft,
          // Incluye los eliminados: un id de pedido nunca se reutiliza (trazabilidad).
          id: nextOrderId([...get().orders, ...get().deletedOrders]),
          date: nowStamp(),
          total: orderTotals(draft.items, draft.charges).total,
          status: 'registrado',
          invoiceId: null,
          reservedUntil: null,
          history: [],
        }
        const order = stamp(base, 'registrado', by, draft.quoteId ? `Convertido desde ${draft.quoteId}` : undefined)
        set((s) => ({ orders: [order, ...s.orders], isLoading: false }))
        return order
      },

      updateOrder: async (orderId, draft, by) => {
        const blocked = editBlockedReason(get().orders.find((o) => o.id === orderId))
        if (blocked) throw new Error(blocked)
        set({ isLoading: true })
        await delay()
        // Se relee tras la espera: otra acción pudo facturarlo o cancelarlo mientras tanto.
        const current = get().orders.find((o) => o.id === orderId)
        const late = editBlockedReason(current)
        if (late || !current) {
          set({ isLoading: false })
          throw new Error(late ?? 'El pedido no existe.')
        }
        const total = orderTotals(draft.items, draft.charges).total
        const note = total === current.total ? 'Pedido editado' : `Pedido editado · total ${current.total.toFixed(2)} → ${total.toFixed(2)}`
        const updated = stamp({ ...current, ...draft, quoteId: current.quoteId, total }, current.status, by, note)
        set((s) => ({ orders: patchOrder(s.orders, orderId, () => updated), isLoading: false }))
        return updated
      },

      deleteOrder: (orderId, by, reason) => {
        const order = get().orders.find((o) => o.id === orderId)
        const blocked = deleteBlockedReason(order)
        if (blocked || !order) throw new Error(blocked ?? 'El pedido no existe.')
        const deleted: DeletedOrder = {
          ...order,
          deletedAt: new Date().toISOString(),
          deletedBy: by,
          deleteReason: reason,
          history: [...order.history, { status: order.status, at: new Date().toISOString(), by, note: `Pedido eliminado · ${reason}` }],
        }
        // No se borra: se mueve a la papelera de auditoría. Su reserva de stock se libera
        // sola porque las reservas se derivan de `orders`.
        set((s) => ({ orders: s.orders.filter((o) => o.id !== orderId), deletedOrders: [deleted, ...s.deletedOrders] }))
        return deleted
      },

      reserve: (orderId, until, by) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order || !canTransition(order.status, 'confirmado')) throw new Error('El pedido ya no está en estado Registrado.')
        const invalid = validateReservationDate(until)
        if (invalid) throw new Error(invalid)
        set((s) => ({
          orders: patchOrder(s.orders, orderId, (o) => stamp({ ...o, reservedUntil: until }, 'confirmado', by, `Reservado hasta ${formatShortISO(until)}`)),
        }))
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
        // "Facturado" solo se alcanza al emitir la factura (setInvoice) y "Reservado" con
        // `reserve` (requiere vigencia); nunca por esta vía.
        if (!order || to === 'facturado' || to === 'confirmado' || !canTransition(order.status, to)) return false
        set((s) => ({ orders: patchOrder(s.orders, orderId, (o) => stamp({ ...o, reservedUntil: null }, to, by, note)) }))
        return true
      },

      setInvoice: (orderId, invoiceId, by) =>
        set((s) => ({
          orders: patchOrder(s.orders, orderId, (o) =>
            invoiceId
              ? stamp({ ...o, invoiceId, reservedUntil: null }, 'facturado', by, `Factura ${invoiceId}`)
              : stamp(
                  { ...o, invoiceId: null, reservedUntil: reservationBounds().suggested },
                  'confirmado',
                  by,
                  `Factura ${o.invoiceId} anulada · reservado hasta ${formatShortISO(reservationBounds().suggested)}`,
                ),
          ),
        })),

      toggleChannel: (channelId) => {
        set((s) => ({
          channels: s.channels.map((c) => (c.id === channelId ? { ...c, active: !c.active } : c)),
        }))
        return get().channels.find((c) => c.id === channelId)
      },

      saveChannel: async (draft) => {
        set({ isLoading: true })
        await delay()
        const id = draft.id || slugify(draft.name)
        const previous = get().channels.find((c) => c.id === id)
        const renamed = previous && previous.name !== draft.name ? previous.name : null
        set((s) => ({
          isLoading: false,
          channels: previous
            ? s.channels.map((c) => (c.id === id ? { ...c, ...draft, id } : c))
            : [...s.channels, { color: 'blue', ...draft, id }],
          // Cascada: los pedidos guardan el nombre del canal.
          orders: renamed ? s.orders.map((o) => (o.channel === renamed ? { ...o, channel: draft.name } : o)) : s.orders,
        }))
        return previous ? 'updated' : 'created'
      },

      deleteChannel: (channelId) => {
        const channel = get().channels.find((c) => c.id === channelId)
        if (channel && ordersOfChannel(get().orders, channel).length > 0) throw new Error('El canal tiene pedidos registrados.')
        set((s) => ({ channels: s.channels.filter((c) => c.id !== channelId) }))
      },

      updateStatusLabel: (statusId, label) => {
        const statusLabels = { ...get().statusLabels, [statusId]: { name: label.name.trim(), description: label.description.trim() } }
        applyStatusLabels(statusLabels)
        set({ statusLabels })
      },

      reset: () => {
        applyStatusLabels({})
        set({ orders: ORDERS_MOCK, deletedOrders: [], channels: CHANNELS_MOCK, statusLabels: {} })
      },
    }),
    {
      name: STORAGE_KEYS.SALES,
      partialize: (s) => ({ orders: s.orders, deletedOrders: s.deletedOrders, channels: s.channels, statusLabels: s.statusLabels }),
      // Los textos personalizados del flujo se aplican a `statusOf` al cargar.
      onRehydrateStorage: () => (state) => applyStatusLabels(state?.statusLabels ?? {}),
      version: SALES_SCHEMA_VERSION,
      // Convierte los pedidos del modelo anterior en vez de descartarlos.
      migrate: (persisted) => {
        const state = persisted as { orders?: Parameters<typeof migrateOrder>[0][]; deletedOrders?: DeletedOrder[]; channels?: Channel[] }
        return {
          orders: state.orders ? state.orders.map(migrateOrder) : ORDERS_MOCK,
          deletedOrders: state.deletedOrders ?? [],
          channels: state.channels ?? CHANNELS_MOCK,
          statusLabels: {},
        }
      },
    },
  ),
)

/** Usado por Facturación al emitir (`invoiceId`) o anular (`null`) una factura. */
export const setOrderInvoice = (orderId: string, invoiceId: string | null, by: string): void =>
  useSalesStore.getState().setInvoice(orderId, invoiceId, by)

export const findOrder = (orderId: string): Order | undefined =>
  useSalesStore.getState().orders.find((o) => o.id === orderId)

/** Lecturas fuera de React para otros features (respaldo y restablecimiento). */
export const getSalesSnapshot = () => {
  const { orders, deletedOrders, channels } = useSalesStore.getState()
  // El respaldo incluye la papelera: la eliminación es lógica y debe poder auditarse.
  return { orders, deletedOrders, orderStatuses: ORDER_STATUSES, channels }
}

export const resetSales = (): void => useSalesStore.getState().reset()
