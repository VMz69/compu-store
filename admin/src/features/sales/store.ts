import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { slugify } from '@/shared/lib/text'
import { orderTotals } from './lib/charges'
import { migrateOrder } from './lib/migrate'
import { findOrderByQuote, nextOrderId, nowStamp } from './lib/order.service'
import { canTransition, ORDER_STATUSES } from './lib/orderFlow'
import { CHANNELS_MOCK } from './mocks/channels.mock'
import { ORDERS_MOCK } from './mocks/orders.mock'
import type { Channel, ChannelDraft, Order, OrderDraft, OrderStatusId } from './types'

interface SalesState {
  orders: Order[]
  channels: Channel[]
  isLoading: boolean
  /** Registra el pedido en estado "Registrado". Lanza error si la cotización ya se convirtió. */
  addOrder: (draft: OrderDraft, by: string) => Promise<Order>
  /** Aplica una transición válida del flujo. Devuelve `false` si no está permitida. */
  transition: (orderId: string, to: OrderStatusId, by: string, note?: string) => boolean
  /** Vincula la factura (→ Facturado) o la desvincula al anularla (→ Confirmado y Listo). */
  setInvoice: (orderId: string, invoiceId: string | null, by: string) => void
  /** Alterna el canal y devuelve su nuevo estado. */
  toggleChannel: (channelId: string) => Channel | undefined
  saveChannel: (draft: ChannelDraft) => Promise<'created' | 'updated'>
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
      channels: CHANNELS_MOCK,
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
          id: nextOrderId(get().orders),
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
        const exists = get().channels.some((c) => c.id === id)
        set((s) => ({
          isLoading: false,
          channels: exists
            ? s.channels.map((c) => (c.id === id ? { ...c, ...draft, id } : c))
            : [...s.channels, { color: 'blue', ...draft, id }],
        }))
        return exists ? 'updated' : 'created'
      },

      reset: () => set({ orders: ORDERS_MOCK, channels: CHANNELS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.SALES,
      partialize: (s) => ({ orders: s.orders, channels: s.channels }),
      version: SALES_SCHEMA_VERSION,
      // Convierte los pedidos del modelo anterior en vez de descartarlos.
      migrate: (persisted) => {
        const state = persisted as { orders?: Parameters<typeof migrateOrder>[0][]; channels?: Channel[] }
        return {
          orders: state.orders ? state.orders.map(migrateOrder) : ORDERS_MOCK,
          channels: state.channels ?? CHANNELS_MOCK,
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
  const { orders, channels } = useSalesStore.getState()
  return { orders, orderStatuses: ORDER_STATUSES, channels }
}

export const resetSales = (): void => useSalesStore.getState().reset()
