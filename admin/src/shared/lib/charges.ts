import { money } from './pricing'

/**
 * Cargos extra de un documento comercial (pedido o cotización): envío, instalación…
 * No son productos: no mueven inventario. Montos con IVA incluido.
 */
export interface ExtraCharge {
  id: string
  concept: string
  /** Monto en dólares con IVA incluido, > 0. */
  amount: number
}

/** Atajos frecuentes en los constructores. */
export const CHARGE_PRESETS = ['Envío', 'Instalación', 'Configuración', 'Garantía extendida'] as const

export const CHARGE_LIMITS = {
  maxCharges: 6,
  minConcept: 3,
  maxConcept: 60,
  /** Tope por cargo: evita errores de tipeo (ej. 3500 en vez de 35.00). */
  maxAmount: 2000,
} as const

export const sumCharges = (charges: Pick<ExtraCharge, 'amount'>[]): number =>
  money(charges.reduce((acc, c) => acc + c.amount, 0))

/** Monto escrito en el formulario → número (NaN si no es un monto válido). */
export const parseAmount = (raw: string): number => {
  const clean = raw.replace(',', '.').trim()
  return /^\d+(\.\d{1,2})?$/.test(clean) ? Number(clean) : NaN
}

/** Errores por cargo, con claves `charges.<id>.concept` / `charges.<id>.amount`. */
export function validateCharges(charges: { id: string; concept: string; amount: string }[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (charges.length > CHARGE_LIMITS.maxCharges) e.charges = `Máximo ${CHARGE_LIMITS.maxCharges} cargos extra por documento.`
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
