import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

/**
 * Comprobación de stock para la facturación (vista previa antes de emitir). Desde L15 la salida por venta
 * y la reposición por anulación (FEFO, a los mismos lotes) las aplica el servidor; el admin relee el catálogo.
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
