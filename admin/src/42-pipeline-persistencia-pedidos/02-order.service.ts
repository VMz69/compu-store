import type { Channel, Order, OrderStatusId } from './05-types'

/** Formas de pago aceptadas en pedidos nuevos (los históricos conservan la que tenían). */
export const PAYMENT_METHODS = ['Efectivo', 'Transferencia']

export const DELIVERY_METHODS = [
  'Retiro en Sala de Ventas (2da Planta)',
  'Envío local Cojutepeque',
  'Envío departamental (encomienda)',
]

export const DEFAULT_CITY = 'Cojutepeque'

export const countByStatus = (orders: Order[], status: OrderStatusId): number =>
  orders.filter((o) => o.status === status).length

export const filterByStatus = (orders: Order[], status: 'all' | OrderStatusId): Order[] =>
  status === 'all' ? orders : orders.filter((o) => o.status === status)

/** Pedidos de un canal (los pedidos guardan el NOMBRE del canal). */
export const ordersOfChannel = (orders: Order[], channel: Channel): Order[] => orders.filter((o) => belongsToChannel(o, channel))

/** Un canal con pedidos no se elimina (perdería su historial): se desactiva. */
export const channelDeleteBlock = (orderCount: number): string | null =>
  orderCount > 0 ? `Tiene ${orderCount} pedido(s). Desactívalo para que no se use en pedidos nuevos.` : null

export function validateChannel(v: { id?: string; name: string; description: string }, channels: Channel[]): Record<string, string> {
  const e: Record<string, string> = {}
  const name = v.name.trim()
  if (name.length < 3 || name.length > 40) e.name = 'Usa entre 3 y 40 caracteres.'
  else if (channels.some((c) => c.id !== v.id && c.name.toLowerCase() === name.toLowerCase())) e.name = 'Ya existe un canal con ese nombre.'
  if (v.description.trim().length > 160) e.description = 'Máximo 160 caracteres.'
  return e
}

const belongsToChannel = (order: Order, channel: Channel): boolean => {
  const a = order.channel.toLowerCase()
  const b = channel.name.toLowerCase()
  return a.includes(b) || b.includes(a)
}

/** Marca de tiempo local "YYYY-MM-DD HH:mm". */
export function nowStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Pedido activo (no cancelado) que ya convirtió una cotización. */
export const findOrderByQuote = (orders: Order[], quoteId: string): Order | undefined =>
  orders.find((o) => o.quoteId === quoteId && o.status !== 'cancelado')

/**
 * Campos en los que busca el buscador de Pedidos (y la cola de Facturación):
 * identificación, cliente, venta, entrega, estado, productos, cargos y vínculos.
 */
export const orderSearchFields = (o: Order, statusName: string): Array<string | number | null> => [
  o.id, o.client, o.phone, o.email, o.city, o.channel, o.paymentMethod, o.deliveryMethod,
  statusName, o.quoteId, o.invoiceId, o.notes, o.date, o.total.toFixed(2),
  ...o.items.flatMap((i) => [i.name, i.sku]),
  ...(o.charges ?? []).map((c) => c.concept),
]
