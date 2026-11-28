import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews } from '@/00-director-acceso'
import { registerDemoData } from '@/84-pipeline-persistencia-demo/00-director-persistencia-demo'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { createQuoteApi, deleteQuoteApi, fetchQuotes, setQuoteStatusApi } from './04-cotizaciones.api'
import type { Quote, QuoteStoredStatus } from './03-types'

/** Datos para emitir: el servidor asigna número, fecha, estado inicial, precios, emisor y autor (L16). */
export type NewQuoteInput = Omit<Quote, 'id' | 'createdAt' | 'status'>

/**
 * Store de cotizaciones: desde L16 la fuente es la API y esto es su caché. Emitir espera al servidor;
 * cambiar el estado y eliminar son optimistas y se revierten con un aviso si el servidor los rechaza.
 */
interface QuotesState {
  quotes: Quote[]
  isLoading: boolean
  /** Emite en el servidor; lanza su error si no procede. */
  createQuote: (input: NewQuoteInput) => Promise<Quote>
  setStatus: (id: string, status: QuoteStoredStatus) => void
  deleteQuote: (id: string) => void
  reset: () => void
}

/** v1: cotizaciones de demostración en el navegador · v2 (L16): las cotizaciones viven en la API. */
const QUOTES_SCHEMA_VERSION = 2

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      quotes: [],
      isLoading: false,

      createQuote: async (input) => {
        set({ isLoading: true })
        try {
          const quote = await createQuoteApi(input)
          // La más reciente primero, igual que en la lista.
          set((s) => ({ quotes: [quote, ...s.quotes], isLoading: false }))
          return quote
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      setStatus: (id, status) => {
        const previous = get().quotes.find((q) => q.id === id)
        if (!previous || status === 'emitida') return
        // Optimista: el servidor decide (422 si ya no está emitida y vigente) y su respuesta reemplaza la caché.
        set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, status } : q)) }))
        setQuoteStatusApi(id, status)
          .then((saved) => set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? saved : q)) })))
          .catch((error: unknown) => {
            set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? previous : q)) }))
            toast(`No se cambió la cotización ${id}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
      },

      deleteQuote: (id) => {
        const { quotes } = get()
        const index = quotes.findIndex((q) => q.id === id)
        const quote = quotes[index]
        if (!quote) return
        // Optimista: sale de la lista ya; si la API la rechaza (409 si originó un pedido), vuelve a su lugar.
        set({ quotes: quotes.filter((q) => q.id !== id) })
        deleteQuoteApi(id).catch((error: unknown) => {
          set((s) => ({ quotes: [...s.quotes.slice(0, index), quote, ...s.quotes.slice(index)] }))
          toast(`No se eliminó la cotización ${id}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      // Mantenimiento: se relee de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadQuotes()
      },
    }),
    {
      name: STORAGE_KEYS.QUOTES,
      partialize: (s) => ({ quotes: s.quotes }),
      version: QUOTES_SCHEMA_VERSION,
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ quotes: [] as Quote[] }),
    },
  ),
)

/** Precarga (al iniciar o restaurar la sesión), solo con la vista Cotizaciones (la que la API acepta). */
async function loadQuotes(): Promise<void> {
  if (!getCurrentViews().includes('cotizaciones')) return
  try {
    useQuotesStore.setState({ quotes: await fetchQuotes() })
  } catch (error) {
    toast(`No se pudieron cargar las cotizaciones: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadQuotes())

// Participa en el respaldo JSON y en el restablecimiento (Ajustes › Mantenimiento).
registerDemoData({
  key: 'quotes',
  reset: () => useQuotesStore.getState().reset(),
  snapshot: () => useQuotesStore.getState().quotes,
})
