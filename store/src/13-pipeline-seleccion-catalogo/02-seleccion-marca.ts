import { useBrands } from '@/38-pipeline-datos-api/00-director-datos-api'
import { useFilters } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'

/**
 * Marca actual y sus productos.
 */
export const useBrandView = (slug = '') => {
  const brands = useBrands()
  const brand = brands.find((item) => item.slug === slug)
  const filters = useFilters({ brand: slug })

  return { brand, ...filters }
}
