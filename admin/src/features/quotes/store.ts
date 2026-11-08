import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { registerDemoData } from '@/shared/lib/demoData'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextQuoteId } from './lib/quote.service'
import { QUOTES_MOCK } from './mocks/quotes.mock'
import type { Quote, QuoteStoredStatus } from './types'

/** Datos para emitir: el store asigna correlativo, fecha y estado inicial. */
export type NewQuoteInput = Omit<Quote, 'id' | 'createdAt' | 'status'>

interface QuotesState {
  quotes: Quote[]
  isLoading: boolean
  createQuote: (input: NewQuoteInput) => Promise<Quote>
  setStatus: (id: string, status: QuoteStoredStatus) => void
  deleteQuote: (id: string) => void
  reset: () => void
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      quotes: QUOTES_MOCK,
      isLoading: false,

      createQuote: async (input) => {
        set({ isLoading: true })
        await delay()
        const quote: Quote = {
          ...input,
          id: nextQuoteId(get().quotes),
          createdAt: new Date().toISOString(),
          status: 'emitida',
        }
        // La más reciente primero, igual que en la lista.
        set((s) => ({ quotes: [quote, ...s.quotes], isLoading: false }))
        return quote
      },

      setStatus: (id, status) =>
        set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, status } : q)) })),

      deleteQuote: (id) => set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

      reset: () => set({ quotes: QUOTES_MOCK }),
    }),
    {
      name: STORAGE_KEYS.QUOTES,
      partialize: (s) => ({ quotes: s.quotes }),
    },
  ),
)

// Participa en el respaldo JSON y en el restablecimiento de fábrica (Ajustes › Mantenimiento).
registerDemoData({
  key: 'quotes',
  reset: () => useQuotesStore.getState().reset(),
  snapshot: () => useQuotesStore.getState().quotes,
})
