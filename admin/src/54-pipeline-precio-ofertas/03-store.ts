import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews, type ViewId } from '@/00-director-acceso'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { offerStatus } from './02-offerPricing'
import { deleteOfferApi, fetchOffers, saveOfferApi, setOfferPausedApi } from './05-ofertas.api'
import type { Offer, OfferDraft } from './04-types'

/** Store de ofertas. Desde L12 la fuente es la API; esto es su caché. */
interface OffersState {
  offers: Offer[]
  isLoading: boolean
  /** Guarda en la API; si falla, la caché no cambia y el error se propaga al formulario. */
  saveOffer: (draft: OfferDraft) => Promise<{ offer: Offer; created: boolean }>
  /** Solo ofertas que no están vigentes (una vigente se pausa primero). Optimista: si la API falla, se revierte y se avisa. */
  deleteOffer: (id: string) => void
  /** Optimista: devuelve el nuevo estado de pausa; si la API falla, se revierte y se avisa. */
  togglePause: (id: string) => boolean
  reset: () => void
}

/** v0: banners · v1: ofertas locales · v2 (L12): las ofertas viven en la API; toda caché anterior era demo. */
const OFFERS_SCHEMA_VERSION = 2

/** Vistas que usan las ofertas (listado, o precio vigente al armar pedidos y cotizaciones); las que la API acepta. */
const READER_VIEWS: ViewId[] = ['ofertas', 'pedidos', 'cotizaciones']

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

const replaceOffer = (offers: Offer[], saved: Offer) => offers.map((o) => (o.id === saved.id ? saved : o))

export const usePromotionsStore = create<OffersState>()(
  persist(
    (set, get) => ({
      offers: [],
      isLoading: false,

      saveOffer: async (draft) => {
        set({ isLoading: true })
        try {
          const offer = await saveOfferApi(draft)
          const created = !get().offers.some((o) => o.id === offer.id)
          set((s) => ({ offers: created ? [offer, ...s.offers] : replaceOffer(s.offers, offer), isLoading: false }))
          return { offer, created }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteOffer: (id) => {
        const { offers } = get()
        const index = offers.findIndex((o) => o.id === id)
        if (index < 0) return
        const removed = offers[index]
        if (offerStatus(removed) === 'vigente') throw new Error('Pausa la oferta antes de eliminarla.')
        set({ offers: offers.filter((o) => o.id !== id) })
        deleteOfferApi(id).catch((error: unknown) => {
          set((s) => ({ offers: [...s.offers.slice(0, index), removed, ...s.offers.slice(index)] }))
          toast(`No se eliminó la oferta "${removed.title}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      togglePause: (id) => {
        const current = get().offers.find((o) => o.id === id)
        if (!current) return false
        const paused = !current.paused
        set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, paused } : o)) }))
        setOfferPausedApi(id, paused)
          .then((saved) => set((s) => ({ offers: replaceOffer(s.offers, saved) })))
          .catch((error: unknown) => {
            set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, paused: current.paused } : o)) }))
            toast(`No se cambió la pausa de "${current.title}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
        return paused
      },

      // Mantenimiento: las ofertas se releen de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadOffers()
      },
    }),
    {
      name: STORAGE_KEYS.PROMOTIONS,
      version: OFFERS_SCHEMA_VERSION,
      partialize: (s) => ({ offers: s.offers }),
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ offers: [] }),
    },
  ),
)

/**
 * Precarga de las ofertas (al iniciar o restaurar la sesión). Solo si el usuario tiene alguna
 * vista que las usa: sin ellas no se pide nada (la API respondería 403) ni se avisa.
 */
async function loadOffers(): Promise<void> {
  if (!getCurrentViews().some((view) => READER_VIEWS.includes(view))) return
  try {
    usePromotionsStore.setState({ offers: await fetchOffers() })
  } catch (error) {
    toast(`No se pudieron cargar las ofertas: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadOffers())

export const resetPromotions = (): void => usePromotionsStore.getState().reset()
