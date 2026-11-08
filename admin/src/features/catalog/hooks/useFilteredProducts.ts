import { useMemo } from 'react'
import { filterProducts } from '../lib/catalog.service'
import { useProductFiltersStore } from '../filters.store'
import { useCatalogStore } from '../store'

/** Productos visibles según búsqueda, categoría y filtro de stock. */
export function useFilteredProducts() {
  const products = useCatalogStore((s) => s.products)
  const category = useProductFiltersStore((s) => s.category)
  const search = useProductFiltersStore((s) => s.search)
  const stockFilter = useProductFiltersStore((s) => s.stockFilter)

  return useMemo(
    () => filterProducts(products, { category, search, stockFilter }),
    [products, category, search, stockFilter],
  )
}
