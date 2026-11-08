import { nextSequentialId } from '@/shared/lib/text'
import type { Channel, Order, OrderMetrics, OrderStatus } from '../types'

export const ORDER_ID_PREFIX = 'ORD-2026-'

/**
 * Estados desde los que un pedido se puede facturar (dar salida).
 * "Pendiente" aún no tiene pago validado y "Cancelado" no se factura.
 */
export const INVOICEABLE_STATUSES = ['Confirmado', 'Listo para Retiro', 'Entregado']

/** Estado al que pasa un pedido al facturarse (la mercadería sale del inventario). */
export const INVOICED_STATUS = 'Entregado'

/** Estado al que vuelve un pedido si se anula su factura (la mercadería regresa). */
export const INVOICE_VOIDED_STATUS = 'Listo para Retiro'

export const isInvoiceable = (order: Order): boolean =>
  !order.invoiceId && INVOICEABLE_STATUSES.includes(order.status)

export const PAYMENT_METHODS = ['Efectivo', 'Tarjeta de Crédito', 'Transferencia', 'Wompi / QR']

export const DEFAULT_DELIVERY = 'Retiro en Sala de Ventas (2da Planta)'

/** Estilo de respaldo si un pedido referencia un estado inexistente. */
export const FALLBACK_STATUS_STYLE = {
  icon: 'fa-circle',
  badgeStyle: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

export function getOrderMetrics(orders: Order[]): OrderMetrics {
  const delivered = orders.filter((o) => o.status === 'Entregado')
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Pendiente' || o.status === 'Confirmado').length,
    readyForPickup: orders.filter((o) => o.status === 'Listo para Retiro').length,
    delivered: delivered.length,
    revenue: delivered.reduce((acc, o) => acc + o.total, 0),
    grossTotal: orders.reduce((acc, o) => acc + o.total, 0),
  }
}

export const countByStatus = (orders: Order[], status: string): number =>
  orders.filter((o) => o.status === status).length

export const filterByStatus = (orders: Order[], status: string): Order[] =>
  status === 'all' ? orders : orders.filter((o) => o.status === status)

const belongsToChannel = (order: Order, channel: Channel): boolean => {
  const a = order.channel.toLowerCase()
  const b = channel.name.toLowerCase()
  return a.includes(b) || b.includes(a)
}

/** Órdenes capturadas y facturación liquidada (entregadas) de un canal. */
export function getChannelStats(channel: Channel, orders: Order[]) {
  const channelOrders = orders.filter((o) => belongsToChannel(o, channel))
  const revenue = channelOrders
    .filter((o) => o.status === 'Entregado')
    .reduce((acc, o) => acc + o.total, 0)
  return { orderCount: channelOrders.length, revenue }
}

export const statusOptionLabel = (status: OrderStatus): string =>
  status.step > 0 ? `${status.step}. ${status.name}` : status.name

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
