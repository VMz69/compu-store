import { useMemo } from 'react'
import { filterAndSort, products, useFilterStore } from '@/features/catalog'

const MAX_SUGGESTIONS = 6

/**
 * Sugerencias de búsqueda para el desplegable global.
 *
 * Se calculan a partir del término activo en el store y se limitan a las
 * primeras coincidencias más relevantes, para no saturar el desplegable.
 */
export const useSearchSuggestions = () => {
  const searchQuery = useFilterStore((state) => state.searchQuery)

  const suggestions = useMemo(() => {
    const term = searchQuery.trim()
    if (!term) return []
    return filterAndSort(products, { searchQuery: term, sortBy: 'featured' }).slice(
      0,
      MAX_SUGGESTIONS,
    )
  }, [searchQuery])

  return { suggestions, hasQuery: searchQuery.trim().length > 0 }
}
