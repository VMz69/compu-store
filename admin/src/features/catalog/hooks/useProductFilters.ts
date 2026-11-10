import { useMemo, type ChangeEvent } from 'react'
import { STOCK_FILTER_OPTIONS } from '../lib/catalog.service'
import { useProductFiltersStore } from '../filters.store'
import { useCatalogStore } from '../store'
import type { StockFilter } from '../types'

/** Estado y handlers de la barra de filtros de Productos. */
export function useProductFilters() {
  const categories = useCatalogStore((s) => s.categories)
  const search = useProductFiltersStore((s) => s.search)
  const category = useProductFiltersStore((s) => s.category)
  const stockFilter = useProductFiltersStore((s) => s.stockFilter)
  const viewMode = useProductFiltersStore((s) => s.viewMode)
  const setSearch = useProductFiltersStore((s) => s.setSearch)
  const setCategory = useProductFiltersStore((s) => s.setCategory)
  const setStockFilter = useProductFiltersStore((s) => s.setStockFilter)
  const setViewMode = useProductFiltersStore((s) => s.setViewMode)

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas las categorías' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  )

  return {
    search,
    category,
    stockFilter,
    viewMode,
    categoryOptions,
    stockOptions: STOCK_FILTER_OPTIONS,
    onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    clearSearch: () => setSearch(''),
    onCategory: (e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value),
    onStock: (e: ChangeEvent<HTMLSelectElement>) => setStockFilter(e.target.value as StockFilter),
    showGrid: () => setViewMode('grid'),
    showTable: () => setViewMode('table'),
  }
}

export type ProductFiltersApi = ReturnType<typeof useProductFilters>
