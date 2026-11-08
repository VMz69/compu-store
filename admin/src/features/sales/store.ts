import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { slugify } from '@/shared/lib/text'
import { nextOrderId, nowStamp } from './lib/order.service'
import { CHANNELS_MOCK } from './mocks/channels.mock'
import { MOCK_ORDER_INVOICES, ORDERS_MOCK } from './mocks/orders.mock'
import { STATUSES_MOCK } from './mocks/statuses.mock'
import type { Channel, ChannelDraft, Order, OrderDraft, OrderStatus } from './types'

interface SalesState {
  orders: Order[]
  statuses: OrderStatus[]
  channels: Channel[]
  isLoading: boolean
  addOrder: (draft: OrderDraft) => Promise<Order>
  setOrderStatus: (orderId: string, status: string) => void
  /** Alterna el canal y devuelve su nuevo estado. */
  toggleChannel: (channelId: string) => Channel | undefined
  saveChannel: (draft: ChannelDraft) => Promise<'created' | 'updated'>
  /** Vincula (o desvincula con `null`) la factura del pedido y fija su estado. */
  setInvoice: (orderId: string, invoiceId: string | null, status: string) => void
  reset: () => void
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      orders: ORDERS_MOCK,
      statuses: STATUSES_MOCK,
      channels: CHANNELS_MOCK,
      isLoading: false,

      addOrder: async (draft) => {
        set({ isLoading: true })
        await delay()
        const order: Order = { id: nextOrderId(get().orders), date: nowStamp(), invoiceId: null, ...draft }
        set((s) => ({ orders: [order, ...s.orders], isLoading: false }))
        return order
      },

      setOrderStatus: (orderId, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) })),

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

      setInvoice: (orderId, invoiceId, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, invoiceId, status } : o)) })),

      reset: () => set({ orders: ORDERS_MOCK, statuses: STATUSES_MOCK, channels: CHANNELS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.SALES,
      partialize: (s) => ({ orders: s.orders, statuses: s.statuses, channels: s.channels }),
      // v1: los pedidos guardados antes de Facturación no tenían `invoiceId`.
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Pick<SalesState, 'orders' | 'statuses' | 'channels'>
        return {
          ...state,
          orders: (state.orders ?? ORDERS_MOCK).map((o) => ({ ...o, invoiceId: o.invoiceId ?? MOCK_ORDER_INVOICES[o.id] ?? null })),
        }
      },
    },
  ),
)

/** Usado por Facturación al emitir o anular una factura. */
export const setOrderInvoice = (orderId: string, invoiceId: string | null, status: string): void =>
  useSalesStore.getState().setInvoice(orderId, invoiceId, status)

/** Lecturas fuera de React para otros features (respaldo y restablecimiento). */
export const getSalesSnapshot = () => {
  const { orders, statuses, channels } = useSalesStore.getState()
  return { orders, orderStatuses: statuses, channels }
}

export const resetSales = (): void => useSalesStore.getState().reset()
