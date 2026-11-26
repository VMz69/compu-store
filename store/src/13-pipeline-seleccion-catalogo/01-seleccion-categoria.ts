import { categories } from '@/38-pipeline-datos-api/00-director-datos-api'
import { useFilters } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'

/**
 * Resuelve la categoría por slug y entrega sus productos filtrados.
 */
export const useCategoryView = (slug = '') => {
  const category = categories.find((item) => item.slug === slug)
  const filters = useFilters({ category: slug })

  return { category, ...filters }
}
