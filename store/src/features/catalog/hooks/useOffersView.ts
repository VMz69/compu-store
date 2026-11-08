import { useFilters } from './useFilters'

/**
 * Productos en oferta y su ordenamiento.
 */
export const useOffersView = () => {
  const { filteredProducts, sortBy, setSortBy, searchQuery } = useFilters({
    onlyOffers: true,
  })

  return { products: filteredProducts, sortBy, setSortBy, searchQuery }
}
