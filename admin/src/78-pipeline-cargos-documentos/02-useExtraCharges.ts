import { useState } from 'react'
import { CHARGE_LIMITS, CHARGE_PRESETS, parseAmount, sumCharges, validateCharges, type ExtraCharge } from '@/78-pipeline-cargos-documentos/03-charges'
import { money } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'

/** Fila editable: el monto se guarda como texto mientras se escribe. */
interface ChargeRow {
  id: string
  concept: string
  amount: string
}

let seq = 0
const newId = () => `CHG-${Date.now().toString(36)}-${++seq}`

/** Cargos extra editables de un constructor (pedidos y cotizaciones): envío, instalación… */
export function useExtraCharges(initial: ExtraCharge[] = []) {
  const [rows, setRows] = useState<ChargeRow[]>(() => initial.map((c) => ({ id: c.id, concept: c.concept, amount: c.amount.toFixed(2) })))

  const patch = (id: string, field: 'concept' | 'amount', value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  /** Cargos válidos listos para guardar (los montos inválidos cuentan como 0 en la vista previa). */
  const charges: ExtraCharge[] = rows.map((r) => {
    const amount = parseAmount(r.amount)
    return { id: r.id, concept: r.concept.trim(), amount: Number.isNaN(amount) ? 0 : money(amount) }
  })

  return {
    rows,
    charges,
    total: sumCharges(charges),
    canAdd: rows.length < CHARGE_LIMITS.maxCharges,
    /** Atajos que aún no se usaron (evita repetir "Envío" dos veces por error). */
    presets: CHARGE_PRESETS.filter((p) => !rows.some((r) => r.concept.trim().toLowerCase() === p.toLowerCase())),
    add: (concept = '') => {
      if (rows.length >= CHARGE_LIMITS.maxCharges) return
      setRows((prev) => [...prev, { id: newId(), concept, amount: '' }])
    },
    remove: (id: string) => setRows((prev) => prev.filter((r) => r.id !== id)),
    bind: (id: string, field: 'concept' | 'amount') => ({
      value: rows.find((r) => r.id === id)?.[field] ?? '',
      onChange: (event: { target: { value: string } }) => patch(id, field, event.target.value),
    }),
    validate: () => validateCharges(rows),
  }
}

export type ExtraChargesApi = ReturnType<typeof useExtraCharges>
