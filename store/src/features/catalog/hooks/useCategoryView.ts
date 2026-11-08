import { categories } from '../mocks/categories.mock'
import { useFilters } from './useFilters'

/**
 * Resuelve la categoría por slug y entrega sus productos filtrados.
 */
export const useCategoryView = (slug = '') => {
  const category = categories.find((item) => item.slug === slug)
  const filters = useFilters({ category: slug })

  return { category, ...filters }
}
