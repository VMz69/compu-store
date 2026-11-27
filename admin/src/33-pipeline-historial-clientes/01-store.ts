import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews, type ViewId } from '@/00-director-acceso'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { createCustomerApi, deleteCustomerApi, fetchCustomers, updateCustomerApi } from './04-clientes.api'
import type { Customer, CustomerDraft } from './03-types'

/** Store del directorio de clientes. Desde L11 la fuente es la API; esto es su caché. */
interface CustomersState {
  customers: Customer[]
  isLoading: boolean
  /** Guarda en la API; si falla, la caché no cambia y el error se propaga al formulario. */
  saveCustomer: (draft: CustomerDraft) => Promise<'created' | 'updated'>
  /** Alta directa; devuelve el cliente con su id (para enlazarlo a un documento). */
  createCustomer: (draft: CustomerDraft) => Promise<Customer>
  /** Optimista: si la API falla, el cliente vuelve a su lugar y se avisa. */
  deleteCustomer: (id: string) => void
  reset: () => void
}

/** v1 (L11): el directorio vive en la API; toda caché anterior era de demostración. */
const CUSTOMERS_SCHEMA_VERSION = 1

/** Vistas cuyo uso necesita el directorio; son las que la API acepta para leerlo. */
const READER_VIEWS: ViewId[] = ['clientes', 'pedidos', 'cotizaciones', 'facturacion']

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,

      saveCustomer: async (draft) => {
        const id = draft.id
        if (!id || !get().customers.some((c) => c.id === id)) {
          await get().createCustomer(draft)
          return 'created'
        }
        set({ isLoading: true })
        try {
          const saved = await updateCustomerApi(id, draft)
          set((s) => ({ customers: s.customers.map((c) => (c.id === saved.id ? saved : c)), isLoading: false }))
          return 'updated'
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      createCustomer: async (draft) => {
        set({ isLoading: true })
        try {
          const created = await createCustomerApi(draft)
          // Los nuevos van primero: es lo que el usuario espera ver tras guardar.
          set((s) => ({ customers: [created, ...s.customers], isLoading: false }))
          return created
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteCustomer: (id) => {
        const { customers } = get()
        const index = customers.findIndex((c) => c.id === id)
        if (index < 0) return
        const removed = customers[index]
        set({ customers: customers.filter((c) => c.id !== id) })
        deleteCustomerApi(id).catch((error: unknown) => {
          set((s) => ({ customers: [...s.customers.slice(0, index), removed, ...s.customers.slice(index)] }))
          toast(`No se eliminó a ${removed.name}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      // Mantenimiento: el directorio se relee de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadCustomers()
      },
    }),
    {
      name: STORAGE_KEYS.CUSTOMERS,
      version: CUSTOMERS_SCHEMA_VERSION,
      partialize: (s) => ({ customers: s.customers }),
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ customers: [] }),
    },
  ),
)

/**
 * Precarga del directorio (al iniciar o restaurar la sesión). Solo si el usuario tiene alguna
 * vista que lo usa: sin ellas no se pide nada (la API respondería 403) ni se avisa.
 */
async function loadCustomers(): Promise<void> {
  if (!getCurrentViews().some((view) => READER_VIEWS.includes(view))) return
  try {
    useCustomersStore.setState({ customers: await fetchCustomers() })
  } catch (error) {
    toast(`No se pudo cargar el directorio de clientes: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadCustomers())

/** Lecturas/acciones fuera de React (respaldo JSON y restablecimiento de fábrica). */
export const getCustomersSnapshot = (): Customer[] => useCustomersStore.getState().customers
export const resetCustomers = (): void => useCustomersStore.getState().reset()
