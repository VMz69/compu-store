import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/84-pipeline-persistencia-demo/04-delay'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { nextSequentialId } from '@/85-pipeline-identificadores-texto/00-director-identificadores-texto'
import { CUSTOMERS_MOCK } from '../../86-pipeline-datos-demo-personas/03-customers.mock'
import type { Customer, CustomerDraft } from './types'

/** Store del directorio de clientes (datos + operaciones con latencia simulada). */
interface CustomersState {
  customers: Customer[]
  isLoading: boolean
  saveCustomer: (draft: CustomerDraft) => Promise<'created' | 'updated'>
  /** Alta directa; devuelve el cliente con su id (para enlazarlo a un documento). */
  createCustomer: (draft: CustomerDraft) => Promise<Customer>
  deleteCustomer: (id: string) => void
  reset: () => void
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: CUSTOMERS_MOCK,
      isLoading: false,

      saveCustomer: async (draft) => {
        const exists = Boolean(draft.id) && get().customers.some((c) => c.id === draft.id)
        if (!exists) {
          await get().createCustomer(draft)
          return 'created'
        }
        set({ isLoading: true })
        await delay()
        set((s) => ({
          customers: s.customers.map((c) => (c.id === draft.id ? { ...c, ...draft, id: c.id } : c)),
          isLoading: false,
        }))
        return 'updated'
      },

      createCustomer: async (draft) => {
        set({ isLoading: true })
        await delay()
        const { customers } = get()
        const created: Customer = {
          ...draft,
          id: nextSequentialId(customers.map((c) => c.id), 'CLI-'),
          createdAt: new Date().toISOString(),
        }
        // Los nuevos van primero: es lo que el usuario espera ver tras guardar.
        set({ customers: [created, ...customers], isLoading: false })
        return created
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
