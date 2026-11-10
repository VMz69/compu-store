import type { Product } from '@/features/catalog'
import type { Order, OrderItem } from '../types'
import { RESERVING_STATUS } from './orderFlow'

/**
 * Reservas de inventario DERIVADAS de los pedidos (no se guardan):
 * reservado(producto) = Σ cantidades en pedidos "Confirmado y Listo".
 *
 * Al ser derivadas no hay que sincronizar nada: cancelar, facturar o anular
 * una factura cambia el estado del pedido y la reserva se recalcula sola.
 */
export function reservedByProduct(orders: Order[], excludeOrderId?: string): Record<string, number> {
  const reserved: Record<string, number> = {}
  for (const order of orders) {
    if (order.status !== RESERVING_STATUS || order.id === excludeOrderId) continue
    for (const item of order.items) reserved[item.productId] = (reserved[item.productId] ?? 0) + item.quantity
  }
  return reserved
}

export interface StockShortage {
  productId: string
  name: string
  requested: number
  available: number
}

/** Líneas que no alcanzan con el stock disponible (stock − reservado por otros pedidos). */
export function findShortages(items: OrderItem[], products: Product[], reserved: Record<string, number>): StockShortage[] {
  const requested = new Map<string, { name: string; qty: number }>()
  for (const i of items) {
    const prev = requested.get(i.productId)
    requested.set(i.productId, { name: i.name, qty: (prev?.qty ?? 0) + i.quantity })
  }
  const shortages: StockShortage[] = []
  for (const [productId, { name, qty }] of requested) {
    const product = products.find((p) => p.id === productId)
    const available = product ? Math.max(0, product.stock - (reserved[productId] ?? 0)) : 0
    if (qty > available) shortages.push({ productId, name: product?.name ?? name, requested: qty, available })
  }
  return shortages
}

export const describeShortages = (shortages: StockShortage[]): string =>
  shortages.map((s) => `${s.name}: pide ${s.requested}, disponible ${s.available}`).join(' · ')
