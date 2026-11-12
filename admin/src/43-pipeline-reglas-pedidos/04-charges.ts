import { sumCharges } from '@/78-pipeline-cargos-documentos/03-charges'
import { money, summarizeLines, type LinesSummary, type PricedLine } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'
import type { OrderCharge } from '../42-pipeline-persistencia-pedidos/05-types'

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
