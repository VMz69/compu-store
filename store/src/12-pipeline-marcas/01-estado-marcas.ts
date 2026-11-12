import { useCatalogStats } from '@/11-pipeline-categorias/00-director-categorias'

/**
 * Marcas con conteo de productos para la página de marcas.
 */
export const useBrandsPage = () => {
  const { brandsWithCounts } = useCatalogStats()
  return { brands: brandsWithCounts }
}
