import { useState, type ChangeEvent } from 'react'
import {
  emptyLotRow,
  emptySpecRow,
  sumLotRows,
  type LotRow,
  type ProductFormValues,
  type ProductScalarField,
  type SpecRow,
} from '../../lib/productForm'
import type { ImageRow } from '../../lib/productImages'

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
type LotTextField = 'lotNumber' | 'quantity' | 'expiresAt'

/**
 * Estado del formulario de producto con listas dinámicas (especificaciones y lotes).
 * Expone "binders" para que los componentes solo hagan spread (`{...bind('name')}`).
 */
export function useProductFormState(initial: ProductFormValues) {
  const [values, setValues] = useState(initial)

  const patch = (partial: Partial<ProductFormValues>) => setValues((v) => ({ ...v, ...partial }))
  const patchSpec = (id: string, partial: Partial<SpecRow>) =>
    setValues((v) => ({ ...v, specs: v.specs.map((s) => (s.id === id ? { ...s, ...partial } : s)) }))
  const patchLot = (id: string, partial: Partial<LotRow>) =>
    setValues((v) => ({ ...v, lots: v.lots.map((l) => (l.id === id ? { ...l, ...partial } : l)) }))

  /** Activar lotes por primera vez traslada el stock manual al primer lote (no se pierde el dato). */
  const toggleLotControl = (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked
    setValues((v) => {
      if (!enabled) return { ...v, lotControl: false, stock: String(sumLotRows(v.lots)) }
      const lotsAreEmpty = sumLotRows(v.lots) === 0
      const lots = lotsAreEmpty ? v.lots.map((l, i) => (i === 0 ? { ...l, quantity: v.stock || '0' } : l)) : v.lots
      return { ...v, lotControl: true, lots }
    })
  }

  return {
    values,
    /** Compara contra el estado inicial para avisar antes de descartar cambios. */
    isDirty: JSON.stringify(values) !== JSON.stringify(initial),

    bind: (key: ProductScalarField) => ({
      name: key,
      value: values[key],
      onChange: (e: ChangeEvent<FieldElement>) => patch({ [key]: e.target.value } as Partial<ProductFormValues>),
    }),
    bindActive: {
      checked: values.active,
      onChange: (e: ChangeEvent<HTMLInputElement>) => patch({ active: e.target.checked }),
    },
    /** Galería: recibe una transformación pura de la lista (ver `lib/productImages`). */
    updateImages: (update: (rows: ImageRow[]) => ImageRow[]) =>
      setValues((v) => ({ ...v, images: update(v.images) })),

    // Especificaciones clave/valor
    addSpec: () => setValues((v) => ({ ...v, specs: [...v.specs, emptySpecRow()] })),
    removeSpec: (id: string) => setValues((v) => ({ ...v, specs: v.specs.filter((s) => s.id !== id) })),
    bindSpec: (id: string, field: 'key' | 'value') => ({
      value: values.specs.find((s) => s.id === id)?.[field] ?? '',
      onChange: (e: ChangeEvent<HTMLInputElement>) => patchSpec(id, { [field]: e.target.value }),
    }),

    // Lotes
    toggleLotControl,
    addLot: () => setValues((v) => ({ ...v, lots: [...v.lots, emptyLotRow()] })),
    /** Siempre queda al menos un lote mientras el control de lotes esté activo. */
    removeLot: (id: string) =>
      setValues((v) => (v.lots.length > 1 ? { ...v, lots: v.lots.filter((l) => l.id !== id) } : v)),
    bindLot: (id: string, field: LotTextField) => ({
      value: values.lots.find((l) => l.id === id)?.[field] ?? '',
      onChange: (e: ChangeEvent<HTMLInputElement>) => patchLot(id, { [field]: e.target.value }),
    }),
    bindLotNoExpiry: (id: string) => ({
      checked: values.lots.find((l) => l.id === id)?.noExpiry ?? false,
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        patchLot(id, e.target.checked ? { noExpiry: true, expiresAt: '' } : { noExpiry: false }),
    }),
  }
}

export type ProductFormState = ReturnType<typeof useProductFormState>
