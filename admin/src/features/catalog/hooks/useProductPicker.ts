import { useMemo, useState, type ChangeEvent } from 'react'
import { useCatalogStore } from '../store'
import type { Product } from '../types'

interface ProductPickerOptions {
  /** Unidades ya agregadas al documento, por producto. */
  quantities: Record<string, number>
  /**
   * Unidades apartadas por otros documentos (ej. pedidos confirmados).
   * Disponible = stock − reservado.
   */
  reserved?: Record<string, number>
  /**
   * Pedidos: no se puede agregar más de lo disponible.
   * Cotizaciones: se permite cotizar "bajo pedido" (agotados y ocultos en web).
   */
  limitToStock?: boolean
}

export interface PickerItem {
  product: Product
  selected: number
  available: number
  /** Motivo por el que no se puede agregar (o `null`). */
  blockedReason: string | null
}

/** Catálogo filtrable para elegir productos en cotizaciones y pedidos. */
export function useProductPicker({ quantities, reserved = {}, limitToStock = false }: ProductPickerOptions) {
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !term || [p.name, p.sku, p.brand, p.model].some((f) => f.toLowerCase().includes(term)))
  }, [products, search, category])

  const items: PickerItem[] = filtered.map((product) => {
    const selected = quantities[product.id] ?? 0
    const available = Math.max(0, product.stock - (reserved[product.id] ?? 0))
    const blockedReason = !limitToStock
      ? null
      : available === 0
        ? product.stock > 0 ? 'Todo el stock está reservado' : 'Agotado'
        : selected >= available ? 'Máximo disponible agregado' : null
    return { product, selected, available, blockedReason }
  })

  return {
    items,
    limitToStock,
    search,
    category,
    categoryOptions: [{ value: 'all', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    onCategory: (e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value),
  }
}

export type ProductPickerApi = ReturnType<typeof useProductPicker>
