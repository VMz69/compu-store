import { useFilters } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'

/**
 * Productos en oferta y su ordenamiento.
 */
export const useOffersView = () => {
  const { filteredProducts, sortBy, setSortBy, searchQuery } = useFilters({
    onlyOffers: true,
  })

  return { products: filteredProducts, sortBy, setSortBy, searchQuery }
}
