import { nextSequentialId } from '@/shared/lib/text'
import type { Channel, Order, OrderMetrics, OrderStatusId } from '../types'
import { ACTIVE_STATUSES, SOLD_STATUSES } from './orderFlow'

export const ORDER_ID_PREFIX = 'ORD-2026-'

/** Formas de pago aceptadas en pedidos nuevos (los históricos conservan la que tenían). */
export const PAYMENT_METHODS = ['Efectivo', 'Transferencia']

export const DELIVERY_METHODS = [
  'Retiro en Sala de Ventas (2da Planta)',
  'Envío local Cojutepeque',
  'Envío departamental (encomienda)',
]

export const DEFAULT_CITY = 'Cojutepeque'

const countIn = (orders: Order[], statuses: OrderStatusId[]) => orders.filter((o) => statuses.includes(o.status))

export function getOrderMetrics(orders: Order[]): OrderMetrics {
  return {
    total: orders.length,
    registered: countByStatus(orders, 'registrado'),
    confirmed: countByStatus(orders, 'confirmado'),
    invoiced: countByStatus(orders, 'facturado'),
    delivered: countByStatus(orders, 'entregado'),
    cancelled: countByStatus(orders, 'cancelado'),
    active: countIn(orders, ACTIVE_STATUSES).length,
    revenue: countIn(orders, SOLD_STATUSES).reduce((acc, o) => acc + o.total, 0),
  }
}

export const countByStatus = (orders: Order[], status: OrderStatusId): number =>
  orders.filter((o) => o.status === status).length

export const filterByStatus = (orders: Order[], status: 'all' | OrderStatusId): Order[] =>
  status === 'all' ? orders : orders.filter((o) => o.status === status)

const belongsToChannel = (order: Order, channel: Channel): boolean => {
  const a = order.channel.toLowerCase()
  const b = channel.name.toLowerCase()
  return a.includes(b) || b.includes(a)
}

/** Órdenes capturadas y venta efectiva (facturada o entregada) de un canal. */
export function getChannelStats(channel: Channel, orders: Order[]) {
  const channelOrders = orders.filter((o) => belongsToChannel(o, channel))
  const revenue = countIn(channelOrders, SOLD_STATUSES).reduce((acc, o) => acc + o.total, 0)
  return { orderCount: channelOrders.length, revenue }
}

export const nextOrderId = (orders: Order[]): string =>
  nextSequentialId(
    orders.map((o) => o.id),
    ORDER_ID_PREFIX,
  )

/** Marca de tiempo local "YYYY-MM-DD HH:mm". */
export function nowStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Pedido activo (no cancelado) que ya convirtió una cotización. */
export const findOrderByQuote = (orders: Order[], quoteId: string): Order | undefined =>
  orders.find((o) => o.quoteId === quoteId && o.status !== 'cancelado')
