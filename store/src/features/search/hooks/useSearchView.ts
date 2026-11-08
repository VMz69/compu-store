import { useFilters } from '@/hooks/useFilters'

/**
 * Resultados de búsqueda y término activo.
 */
export const useSearchView = () => {
  const { filteredProducts, searchQuery, sortBy, setSortBy, resetFilters } = useFilters()

  return { products: filteredProducts, searchQuery, sortBy, setSortBy, resetFilters }
}
