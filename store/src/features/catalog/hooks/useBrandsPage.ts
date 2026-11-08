import { useCatalogStats } from './useCatalogStats'

/**
 * Marcas con conteo de productos para la página de marcas.
 */
export const useBrandsPage = () => {
  const { brandsWithCounts } = useCatalogStats()
  return { brands: brandsWithCounts }
}
