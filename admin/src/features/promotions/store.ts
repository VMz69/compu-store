import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextSequentialId } from '@/shared/lib/text'
import { PROMOTIONS_MOCK } from './mocks/promotions.mock'
import type { Promotion, PromotionDraft } from './types'

interface PromotionsState {
  promotions: Promotion[]
  isLoading: boolean
  addPromotion: (draft: PromotionDraft) => Promise<Promotion>
  reset: () => void
}

export const usePromotionsStore = create<PromotionsState>()(
  persist(
    (set, get) => ({
      promotions: PROMOTIONS_MOCK,
      isLoading: false,

      addPromotion: async (draft) => {
        set({ isLoading: true })
        await delay()
        const promotion: Promotion = {
          id: nextSequentialId(
            get().promotions.map((p) => p.id),
            'PRM-',
          ),
          active: true,
          ...draft,
        }
        set((s) => ({ promotions: [...s.promotions, promotion], isLoading: false }))
        return promotion
      },

      reset: () => set({ promotions: PROMOTIONS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.PROMOTIONS,
      partialize: (s) => ({ promotions: s.promotions }),
    },
  ),
)

export const resetPromotions = (): void => usePromotionsStore.getState().reset()
