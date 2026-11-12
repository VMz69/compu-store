import { useCatalogStats } from './01-estadisticas-catalogo'

/**
 * Datos del hub de categorías.
 */
export const useCatalogHub = () => {
  const { categoriesWithCounts, totalProducts } = useCatalogStats()
  return { categories: categoriesWithCounts, totalProducts }
}
