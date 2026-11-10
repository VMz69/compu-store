import { create } from 'zustand'
import { nextSort, type SortState } from '@/shared/lib/sort'
import { DEFAULT_ORDER_SORT, FIRST_DIR, type OrderSortKey } from './lib/orderSort'
import type { OrderStatusId } from './types'

export type OrderStatusFilter = 'all' | OrderStatusId

/**
 * Filtro de estado y orden de la vista Pedidos. Global para que Ajustes pueda
 * pre-filtrar y para que el orden se conserve al ir a editar un pedido y volver.
 */
interface OrderFiltersState {
  statusFilter: OrderStatusFilter
  sort: SortState<OrderSortKey>
  setStatusFilter: (status: OrderStatusFilter) => void
  toggleSort: (key: OrderSortKey) => void
}

export const useOrderFiltersStore = create<OrderFiltersState>()((set) => ({
  statusFilter: 'all',
  sort: DEFAULT_ORDER_SORT,
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  toggleSort: (key) => set((s) => ({ sort: nextSort(s.sort, key, FIRST_DIR[key]) })),
}))
