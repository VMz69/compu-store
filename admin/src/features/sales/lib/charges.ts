import { sumCharges } from '@/shared/lib/charges'
import { money, summarizeLines, type LinesSummary, type PricedLine } from '@/shared/lib/pricing'
import type { OrderCharge } from '../types'

/** Totales del pedido. La lógica genérica de cargos vive en `shared/lib/charges`. */
export interface OrderTotals extends LinesSummary {
  /** Total de productos (con descuentos). */
  productsTotal: number
  /** Suma de cargos extra. */
  chargesTotal: number
}

/** Totales del pedido: productos + cargos extra (todo con IVA incluido). */
export function orderTotals(items: PricedLine[], charges: Pick<OrderCharge, 'amount'>[]): OrderTotals {
  const lines = summarizeLines(items)
  const chargesTotal = sumCharges(charges)
  return { ...lines, productsTotal: lines.total, chargesTotal, total: money(lines.total + chargesTotal) }
}
