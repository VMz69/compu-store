import { brands } from '@/data'
import { useFilters } from '@/hooks/useFilters'

/**
 * Marca actual y sus productos.
 */
export const useBrandView = (slug = '') => {
  const brand = brands.find((item) => item.slug === slug)
  const filters = useFilters({ brand: slug })

  return { brand, ...filters }
}
