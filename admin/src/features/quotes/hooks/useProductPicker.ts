import { useMemo, useState, type ChangeEvent } from 'react'
import { useCatalogStore, type Product } from '@/features/catalog'

/**
 * Catálogo filtrable para elegir productos a cotizar.
 * Incluye agotados y ocultos en web: se pueden cotizar "bajo pedido"; la vista los marca.
 */
export function useProductPicker(quantities: Record<string, number>) {
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const items = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !term || [p.name, p.sku, p.brand, p.model].some((f) => f.toLowerCase().includes(term)))
  }, [products, search, category])

  return {
    items: items.map((product: Product) => ({ product, inQuote: quantities[product.id] ?? 0 })),
    search,
    category,
    categoryOptions: [{ value: 'all', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    onCategory: (e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value),
  }
}

export type ProductPickerApi = ReturnType<typeof useProductPicker>
