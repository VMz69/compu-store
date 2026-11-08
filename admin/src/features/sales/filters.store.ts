import { create } from 'zustand'

/** Filtro de estado de la vista Pedidos. Global para que Ajustes pueda pre-filtrar. */
interface OrderFiltersState {
  statusFilter: string
  setStatusFilter: (status: string) => void
}

export const useOrderFiltersStore = create<OrderFiltersState>()((set) => ({
  statusFilter: 'all',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
