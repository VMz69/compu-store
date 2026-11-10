import { useMemo, useState, type ChangeEvent } from 'react'
import { matchesQuery } from '@/shared/lib/text'
import { useEffectivePrice } from '../lib/pricePort'
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
  /** Precio vigente (con oferta si aplica) y nombre de la oferta. */
  price: number
  offerTitle: string | null
}

/** Catálogo filtrable para elegir productos en cotizaciones y pedidos. */
export function useProductPicker({ quantities, reserved = {}, limitToStock = false }: ProductPickerOptions) {
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const priceOf = useEffectivePrice()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {

    return products
      .filter((p) => category === 'all' || p.category === category)
      // Búsqueda unificada del sistema (varias palabras, sin tildes).
      .filter((p) => matchesQuery([p.name, p.sku, p.brand, p.model], search))
  }, [products, search, category])

  const items: PickerItem[] = filtered.map((product) => {
    const selected = quantities[product.id] ?? 0
    const available = Math.max(0, product.stock - (reserved[product.id] ?? 0))
    const blockedReason = !limitToStock
      ? null
      : available === 0
        ? product.stock > 0 ? 'Todo el stock está reservado' : 'Agotado'
        : selected >= available ? 'Máximo disponible agregado' : null
    const { price, offer } = priceOf(product)
    return { product, selected, available, blockedReason, price, offerTitle: offer?.title ?? null }
  })

  return {
    items,
    limitToStock,
    search,
    category,
    categoryOptions: [{ value: 'all', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    clearSearch: () => setSearch(''),
    onCategory: (e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value),
  }
}

export type ProductPickerApi = ReturnType<typeof useProductPicker>
