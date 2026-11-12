import { useMemo } from 'react'
import { products } from '@/06-pipeline-datos-mock/00-director-datos-mock'
import { filterAndSort } from './01-consultas-productos'
import { useFilterStore } from './03-filtros.store'
import type { ProductFilters } from '@/00-director-modelos'

/**
 * Filtra y ordena el catálogo de forma memoizada según la ruta y los filtros globales.
 */
export const useFilters = (options: ProductFilters = {}) => {
  const { category, brand, onlyOffers = false } = options
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const sortBy = useFilterStore((state) => state.sortBy)
  const setSortBy = useFilterStore((state) => state.setSortBy)
  const resetFilters = useFilterStore((state) => state.resetFilters)

  const filteredProducts = useMemo(
    () =>
      filterAndSort(products, {
        category,
        brand,
        onlyOffers,
        searchQuery,
        sortBy,
      }),
    [category, brand, onlyOffers, searchQuery, sortBy],
  )

  return { filteredProducts, searchQuery, sortBy, setSortBy, resetFilters }
}
