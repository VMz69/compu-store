import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews } from '@/00-director-acceso'
import { registerDemoData } from '@/84-pipeline-persistencia-demo/00-director-persistencia-demo'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { emitInvoiceApi, fetchInvoices, voidInvoiceApi, type EmitInvoiceInput } from './04-facturas.api'
import type { Invoice } from './03-types'

/** Datos para emitir: el servidor copia las líneas del pedido y asigna emisor, números, fecha y autor (L15). */
export type NewInvoiceInput = EmitInvoiceInput

/**
 * Store de facturas: desde L15 la fuente es la API y esto es su caché. Emitir y anular son una sola
 * transacción en el servidor (factura, stock y pedido); quien llama relee el pedido y el catálogo.
 */
interface BillingState {
  invoices: Invoice[]
  isLoading: boolean
  /** Emite en el servidor; lanza su error si no procede. */
  createInvoice: (input: NewInvoiceInput) => Promise<Invoice>
  /** Anula en el servidor; lanza su error si no procede. */
  voidInvoice: (id: string) => Promise<Invoice>
  reset: () => void
}

/** v1: facturas de demostración en el navegador · v2 (L15): las facturas viven en la API. */
const BILLING_SCHEMA_VERSION = 2

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      invoices: [],
      isLoading: false,

      createInvoice: async (input) => {
        set({ isLoading: true })
        try {
          const invoice = await emitInvoiceApi(input)
          set((s) => ({ invoices: [invoice, ...s.invoices], isLoading: false }))
          return invoice
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      voidInvoice: async (id) => {
        const voided = await voidInvoiceApi(id)
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? voided : i)) }))
        return voided
      },

      // Mantenimiento: se relee de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadInvoices()
      },
    }),
    {
      name: STORAGE_KEYS.INVOICES,
      partialize: (s) => ({ invoices: s.invoices }),
      version: BILLING_SCHEMA_VERSION,
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ invoices: [] as Invoice[] }),
    },
  ),
)

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** Precarga (al iniciar o restaurar la sesión), solo con la vista Facturación (la que la API acepta). */
async function loadInvoices(): Promise<void> {
  if (!getCurrentViews().includes('facturacion')) return
  try {
    useBillingStore.setState({ invoices: await fetchInvoices() })
  } catch (error) {
    toast(`No se pudieron cargar las facturas: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadInvoices())

// Participa en el respaldo JSON y en el restablecimiento (Ajustes › Mantenimiento).
registerDemoData({
  key: 'invoices',
  reset: () => useBillingStore.getState().reset(),
  snapshot: () => useBillingStore.getState().invoices,
})
