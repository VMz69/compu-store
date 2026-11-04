import { create } from 'zustand'
import type { SortBy } from '@/types'

/**
 * Filtros de búsqueda y ordenamiento compartidos entre header, catálogo y
 * resultados. No se persiste: cada sesión inicia con valores por defecto.
 */
interface FilterStore {
  searchQuery: string
  sortBy: SortBy
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: SortBy) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: '',
  sortBy: 'featured',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set({ searchQuery: '', sortBy: 'featured' }),
}))
