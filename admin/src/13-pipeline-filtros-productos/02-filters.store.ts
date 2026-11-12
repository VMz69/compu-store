import { create } from 'zustand'
import type { ProductViewMode, StockFilter } from '../25-pipeline-persistencia-catalogo/04-types'

/** Filtros de la vista Productos. Globales para que Categorías/Ofertas puedan pre-filtrar. */
interface ProductFiltersState {
  category: string
  stockFilter: StockFilter
  search: string
  viewMode: ProductViewMode
  setCategory: (category: string) => void
  setStockFilter: (filter: StockFilter) => void
  setSearch: (search: string) => void
  setViewMode: (mode: ProductViewMode) => void
}

export const useProductFiltersStore = create<ProductFiltersState>()((set) => ({
  category: 'all',
  stockFilter: 'all',
  search: '',
  viewMode: 'grid',
  setCategory: (category) => set({ category }),
  setStockFilter: (stockFilter) => set({ stockFilter }),
  setSearch: (search) => set({ search }),
  setViewMode: (viewMode) => set({ viewMode }),
}))
