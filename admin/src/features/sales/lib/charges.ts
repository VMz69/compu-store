import { money, summarizeLines, type LinesSummary, type PricedLine } from '@/shared/lib/pricing'
import type { OrderCharge } from '../types'

/**
 * Cargos extra del pedido (lógica pura). Se suman al total, no tocan el inventario
 * y en Facturación se convierten en líneas de servicio.
 */

/** Atajos frecuentes en el constructor de pedidos. */
export const CHARGE_PRESETS = ['Envío', 'Instalación', 'Configuración', 'Garantía extendida'] as const

export const CHARGE_LIMITS = {
  maxCharges: 6,
  minConcept: 3,
  maxConcept: 60,
  /** Tope por cargo: evita errores de tipeo (ej. 3500 en vez de 35.00). */
  maxAmount: 2000,
} as const

export interface OrderTotals extends LinesSummary {
  /** Total de productos (con descuentos). */
  productsTotal: number
  /** Suma de cargos extra. */
  chargesTotal: number
}

export const sumCharges = (charges: Pick<OrderCharge, 'amount'>[]): number =>
  money(charges.reduce((acc, c) => acc + c.amount, 0))

/** Totales del pedido: productos + cargos extra (todo con IVA incluido). */
export function orderTotals(items: PricedLine[], charges: Pick<OrderCharge, 'amount'>[]): OrderTotals {
  const lines = summarizeLines(items)
  const chargesTotal = sumCharges(charges)
  return { ...lines, productsTotal: lines.total, chargesTotal, total: money(lines.total + chargesTotal) }
}

/** Monto escrito en el formulario → número (NaN si no es un monto válido). */
export const parseAmount = (raw: string): number => {
  const clean = raw.replace(',', '.').trim()
  return /^\d+(\.\d{1,2})?$/.test(clean) ? Number(clean) : NaN
}

/** Errores por cargo, con claves `charges.<id>.concept` / `charges.<id>.amount`. */
export function validateCharges(charges: { id: string; concept: string; amount: string }[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (charges.length > CHARGE_LIMITS.maxCharges) e.charges = `Máximo ${CHARGE_LIMITS.maxCharges} cargos extra por pedido.`
  for (const c of charges) {
    const concept = c.concept.trim()
    if (concept.length < CHARGE_LIMITS.minConcept) e[`charges.${c.id}.concept`] = 'Describe el cargo (mín. 3 letras).'
    else if (concept.length > CHARGE_LIMITS.maxConcept) e[`charges.${c.id}.concept`] = `Máximo ${CHARGE_LIMITS.maxConcept} caracteres.`
    const amount = parseAmount(c.amount)
    if (Number.isNaN(amount)) e[`charges.${c.id}.amount`] = 'Monto inválido (ej. 3.50).'
    else if (amount <= 0) e[`charges.${c.id}.amount`] = 'Debe ser mayor que $0.'
    else if (amount > CHARGE_LIMITS.maxAmount) e[`charges.${c.id}.amount`] = `Máximo $${CHARGE_LIMITS.maxAmount} por cargo.`
  }
  return e
}
