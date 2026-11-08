import { useCatalogStats } from './useCatalogStats'

/**
 * Datos del hub de categorías.
 */
export const useCatalogHub = () => {
  const { categoriesWithCounts, totalProducts } = useCatalogStats()
  return { categories: categoriesWithCounts, totalProducts }
}
