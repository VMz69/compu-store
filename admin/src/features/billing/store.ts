import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { registerDemoData } from '@/shared/lib/demoData'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { newGenerationCode, nextControlNumber, nextInternalId, simulatedSeal } from './lib/invoice.service'
import { INVOICES_MOCK } from '../../88-pipeline-datos-demo-documentos/03-invoices.mock'
import type { Invoice } from './types'

/** Datos para emitir: el store asigna número de control, códigos, fecha y estado. */
export type NewInvoiceInput = Omit<Invoice, 'id' | 'generationCode' | 'receptionSeal' | 'internalId' | 'status' | 'createdAt' | 'voidedAt'>

/**
 * Store de facturas: solo datos. Los efectos sobre otros módulos (descontar
 * stock, cerrar el pedido) los coordina el hook de emisión/anulación.
 */
interface BillingState {
  invoices: Invoice[]
  isLoading: boolean
  /** `internalSeed`: semilla del correlativo (Ajustes › Identidad); ver `nextInternalNumber`. */
  createInvoice: (input: NewInvoiceInput, internalSeed?: number | null) => Promise<Invoice>
  voidInvoice: (id: string) => void
  reset: () => void
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      invoices: INVOICES_MOCK,
      isLoading: false,

      createInvoice: async (input, internalSeed = null) => {
        set({ isLoading: true })
        await delay()
        const { invoices } = get()
        const invoice: Invoice = {
          ...input,
          id: nextControlNumber(invoices),
          internalId: nextInternalId(invoices, internalSeed),
          generationCode: newGenerationCode(),
          receptionSeal: simulatedSeal(),
          status: 'emitida',
          createdAt: new Date().toISOString(),
          voidedAt: null,
        }
        set({ invoices: [invoice, ...invoices], isLoading: false })
        return invoice
      },

      voidInvoice: (id) =>
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: 'anulada', voidedAt: new Date().toISOString() } : i)),
        })),

      reset: () => set({ invoices: INVOICES_MOCK }),
    }),
    {
      name: STORAGE_KEYS.INVOICES,
      partialize: (s) => ({ invoices: s.invoices }),
    },
  ),
)

// Participa en el respaldo JSON y en el restablecimiento de fábrica (Ajustes › Mantenimiento).
registerDemoData({
  key: 'invoices',
  reset: () => useBillingStore.getState().reset(),
  snapshot: () => useBillingStore.getState().invoices,
})
