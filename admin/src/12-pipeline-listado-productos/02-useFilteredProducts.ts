import { useMemo } from 'react'
import { filterProducts } from '../25-pipeline-persistencia-catalogo/02-catalog.service'
import { useProductFiltersStore } from '../13-pipeline-filtros-productos/02-filters.store'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'

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
