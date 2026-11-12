import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCatalogSnapshot } from '@/00-director-catalogo'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextSequentialId } from '@/shared/lib/text'
import { offerStatus, today } from './lib/offerPricing'
import { OFFERS_MOCK } from './mocks/promotions.mock'
import type { Offer, OfferDraft } from './types'

interface OffersState {
  offers: Offer[]
  isLoading: boolean
  saveOffer: (draft: OfferDraft) => Promise<{ offer: Offer; created: boolean }>
  /** Solo ofertas que no están vigentes (una vigente se pausa primero). */
  deleteOffer: (id: string) => void
  togglePause: (id: string) => boolean
  reset: () => void
}

/** Campaña del modelo anterior (banner con texto libre por categoría). */
type LegacyPromotion = { id: string; title: string; badge: string; description: string; targetCategory: string }

/**
 * v0: banners por categoría sin precio · v1: ofertas con productos, descuento y vigencia.
 * Las campañas antiguas pasan a ofertas PAUSADAS de 10% con los productos de su
 * categoría, para revisarlas antes de activarlas.
 */
const OFFERS_SCHEMA_VERSION = 1

const migrateLegacy = (legacy: LegacyPromotion[]): Offer[] => {
  const { products } = getCatalogSnapshot()
  const start = today()
  return legacy.map((p) => ({
    id: p.id, title: p.title, badge: p.badge, description: p.description,
    productIds: products.filter((x) => x.category === p.targetCategory).map((x) => x.id),
    discountType: 'percent', discountValue: 10, startDate: start, endDate: start, paused: true,
    createdAt: new Date().toISOString(),
  }))
}

export const usePromotionsStore = create<OffersState>()(
  persist(
    (set, get) => ({
      offers: OFFERS_MOCK,
      isLoading: false,

      saveOffer: async ({ id, ...data }) => {
        set({ isLoading: true })
        await delay()
        const current = id ? get().offers.find((o) => o.id === id) : undefined
        if (current) {
          const offer = { ...current, ...data }
          set((s) => ({ offers: s.offers.map((o) => (o.id === id ? offer : o)), isLoading: false }))
          return { offer, created: false }
        }
        const offer: Offer = { id: nextSequentialId(get().offers.map((o) => o.id), 'PRM-'), ...data, createdAt: new Date().toISOString() }
        set((s) => ({ offers: [offer, ...s.offers], isLoading: false }))
        return { offer, created: true }
      },

      deleteOffer: (id) => {
        const offer = get().offers.find((o) => o.id === id)
        if (offer && offerStatus(offer) === 'vigente') throw new Error('Pausa la oferta antes de eliminarla.')
        set((s) => ({ offers: s.offers.filter((o) => o.id !== id) }))
      },

      togglePause: (id) => {
        const paused = !get().offers.find((o) => o.id === id)?.paused
        set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, paused } : o)) }))
        return paused
      },

      reset: () => set({ offers: OFFERS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.PROMOTIONS,
      version: OFFERS_SCHEMA_VERSION,
      partialize: (s) => ({ offers: s.offers }),
      migrate: (persisted) => {
        const state = persisted as { offers?: Offer[]; promotions?: LegacyPromotion[] }
        return { offers: state.offers ?? (state.promotions ? migrateLegacy(state.promotions) : OFFERS_MOCK) }
      },
    },
  ),
)

export const resetPromotions = (): void => usePromotionsStore.getState().reset()
