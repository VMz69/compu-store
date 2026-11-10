import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { slugify } from '@/shared/lib/text'
import { orderTotals } from './lib/charges'
import { migrateOrder } from './lib/migrate'
import { findOrderByQuote, nextOrderId, nowStamp, ordersOfChannel } from './lib/order.service'
import { applyStatusLabels, canTransition, deleteBlockedReason, editBlockedReason, ORDER_STATUSES, type StatusLabel, type StatusLabels } from './lib/orderFlow'
import { CHANNELS_MOCK } from './mocks/channels.mock'
import { ORDERS_MOCK } from './mocks/orders.mock'
import type { Channel, ChannelDraft, DeletedOrder, Order, OrderDraft, OrderStatusId } from './types'

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
  /** Aplica una transición válida del flujo. Devuelve `false` si no está permitida. */
  transition: (orderId: string, to: OrderStatusId, by: string, note?: string) => boolean
  /** Vincula la factura (→ Facturado) o la desvincula al anularla (→ Confirmado y Listo). */
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
 * · v3: cargos extra (`charges`).
 */
const SALES_SCHEMA_VERSION = 3

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

      transition: (orderId, to, by, note) => {
        const order = get().orders.find((o) => o.id === orderId)
        // "Facturado" solo se alcanza al emitir la factura (setInvoice), nunca a mano.
        if (!order || to === 'facturado' || !canTransition(order.status, to)) return false
        set((s) => ({ orders: patchOrder(s.orders, orderId, (o) => stamp(o, to, by, note)) }))
        return true
      },

      setInvoice: (orderId, invoiceId, by) =>
        set((s) => ({
          orders: patchOrder(s.orders, orderId, (o) =>
            invoiceId
              ? stamp({ ...o, invoiceId }, 'facturado', by, `Factura ${invoiceId}`)
              : stamp({ ...o, invoiceId: null }, 'confirmado', by, `Factura ${o.invoiceId} anulada`),
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
