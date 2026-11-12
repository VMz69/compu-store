import { create } from 'zustand'
import { nextSort, type SortState } from '@/82-pipeline-calculo-importes/03-sort'
import { DEFAULT_ORDER_SORT, FIRST_DIR, type OrderSortKey } from './lib/orderSort'
import type { OrderStatusId } from './types'

export type OrderStatusFilter = 'all' | OrderStatusId

/**
 * Filtro de estado y orden de la vista Pedidos. Global para que Ajustes pueda
 * pre-filtrar y para que el orden y la búsqueda se conserven al ir a editar un pedido y volver.
 */
interface OrderFiltersState {
  statusFilter: OrderStatusFilter
  sort: SortState<OrderSortKey>
  /** Búsqueda en tiempo real (varios parámetros, ver `orderSearchFields`). */
  search: string
  setStatusFilter: (status: OrderStatusFilter) => void
  setSearch: (search: string) => void
  toggleSort: (key: OrderSortKey) => void
}

export const useOrderFiltersStore = create<OrderFiltersState>()((set) => ({
  statusFilter: 'all',
  sort: DEFAULT_ORDER_SORT,
  search: '',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearch: (search) => set({ search }),
  toggleSort: (key) => set((s) => ({ sort: nextSort(s.sort, key, FIRST_DIR[key]) })),
}))
