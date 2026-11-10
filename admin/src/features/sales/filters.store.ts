import { create } from 'zustand'
import type { OrderStatusId } from './types'

export type OrderStatusFilter = 'all' | OrderStatusId

/** Filtro de estado de la vista Pedidos. Global para que Ajustes pueda pre-filtrar. */
interface OrderFiltersState {
  statusFilter: OrderStatusFilter
  setStatusFilter: (status: OrderStatusFilter) => void
}

export const useOrderFiltersStore = create<OrderFiltersState>()((set) => ({
  statusFilter: 'all',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
