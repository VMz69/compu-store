import type { Product, ProductLot } from '../25-pipeline-persistencia-catalogo/04-types'
import { sumLots } from '../20-pipeline-validacion-producto/03-normalize'

/**
 * Movimientos de inventario por venta (facturación) y devolución (anulación).
 * Funciones puras: reciben productos y devuelven productos nuevos.
 */

export interface StockLine {
  productId: string
  quantity: number
}

export interface AvailabilityRow {
  productId: string
  name: string
  requested: number
  available: number
  /** `false` si el producto ya no existe en el catálogo. */
  exists: boolean
  ok: boolean
}

/** Agrupa cantidades por producto (un pedido podría repetir un producto en varias líneas). */
const groupLines = (lines: StockLine[]): Map<string, number> =>
  lines.reduce((acc, l) => acc.set(l.productId, (acc.get(l.productId) ?? 0) + l.quantity), new Map<string, number>())

/** ¿Alcanza el stock para todas las líneas? Devuelve el detalle por producto. */
export function checkAvailability(products: Product[], lines: StockLine[], names: Record<string, string> = {}): AvailabilityRow[] {
  return [...groupLines(lines)].map(([productId, requested]) => {
    const product = products.find((p) => p.id === productId)
    const available = product?.stock ?? 0
    return {
      productId,
      name: product?.name ?? names[productId] ?? productId,
      requested,
      available,
      exists: Boolean(product),
      ok: Boolean(product) && available >= requested,
    }
  })
}

/**
 * Descuenta de los lotes con vencimiento más próximo primero (FEFO);
 * los lotes que no vencen se consumen al final.
 */
function consumeLots(lots: ProductLot[], quantity: number): ProductLot[] {
  let pending = quantity
  const order = [...lots].sort((a, b) => (a.expiresAt ?? '9999').localeCompare(b.expiresAt ?? '9999'))
  const consumed = new Map<string, number>()
  for (const lot of order) {
    if (pending <= 0) break
    const take = Math.min(lot.quantity, pending)
    consumed.set(lot.id, lot.quantity - take)
    pending -= take
  }
  return lots.map((lot) => (consumed.has(lot.id) ? { ...lot, quantity: consumed.get(lot.id) ?? 0 } : lot))
}

/** Aplica una venta: resta del stock (o de los lotes) sin bajar de cero. */
export function deductFromProducts(products: Product[], lines: StockLine[]): Product[] {
  const grouped = groupLines(lines)
  return products.map((p) => {
    const qty = grouped.get(p.id)
    if (!qty) return p
    if (!p.lotControl) return { ...p, stock: Math.max(0, p.stock - qty) }
    const lots = consumeLots(p.lots, qty)
    return { ...p, lots, stock: sumLots(lots) }
  })
}

/** Aplica una devolución: suma al stock (con lotes, al primer lote registrado). */
export function restockProducts(products: Product[], lines: StockLine[]): Product[] {
  const grouped = groupLines(lines)
  return products.map((p) => {
    const qty = grouped.get(p.id)
    if (!qty) return p
    if (!p.lotControl || p.lots.length === 0) return { ...p, stock: p.stock + qty }
    const lots = p.lots.map((lot, i) => (i === 0 ? { ...lot, quantity: lot.quantity + qty } : lot))
    return { ...p, lots, stock: sumLots(lots) }
  })
}
