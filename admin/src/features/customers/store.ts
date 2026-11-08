import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextSequentialId } from '@/shared/lib/text'
import { CUSTOMERS_MOCK } from './mocks/customers.mock'
import type { Customer, CustomerDraft } from './types'

/** Store del directorio de clientes (datos + operaciones con latencia simulada). */
interface CustomersState {
  customers: Customer[]
  isLoading: boolean
  saveCustomer: (draft: CustomerDraft) => Promise<'created' | 'updated'>
  deleteCustomer: (id: string) => void
  reset: () => void
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: CUSTOMERS_MOCK,
      isLoading: false,

      saveCustomer: async (draft) => {
        set({ isLoading: true })
        await delay()
        const { customers } = get()
        const current = draft.id ? customers.find((c) => c.id === draft.id) : undefined
        if (current) {
          set({ customers: customers.map((c) => (c.id === current.id ? { ...c, ...draft, id: c.id } : c)), isLoading: false })
          return 'updated'
        }
        const created: Customer = {
          ...draft,
          id: nextSequentialId(customers.map((c) => c.id), 'CLI-'),
          createdAt: new Date().toISOString(),
        }
        // Los nuevos van primero: es lo que el usuario espera ver tras guardar.
        set({ customers: [created, ...customers], isLoading: false })
        return 'created'
      },

      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      reset: () => set({ customers: CUSTOMERS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.CUSTOMERS,
      partialize: (s) => ({ customers: s.customers }),
    },
  ),
)

/** Lecturas/acciones fuera de React (respaldo JSON y restablecimiento de fábrica). */
export const getCustomersSnapshot = (): Customer[] => useCustomersStore.getState().customers
export const resetCustomers = (): void => useCustomersStore.getState().reset()
