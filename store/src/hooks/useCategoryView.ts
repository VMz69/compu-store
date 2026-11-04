import { categories } from '@/data'
import { useFilters } from '@/hooks/useFilters'

/**
 * Resuelve la categoría por slug y entrega sus productos filtrados.
 */
export const useCategoryView = (slug = '') => {
  const category = categories.find((item) => item.slug === slug)
  const filters = useFilters({ category: slug })

  return { category, ...filters }
}
