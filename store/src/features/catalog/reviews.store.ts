import { create } from 'zustand'
import { INITIAL_REVIEWS } from './mocks/reviews.mock'
import type { Review } from '@/shared/types'

/**
 * Reseñas por producto. En esta fase viven en memoria; la forma del estado ya
 * está preparada para sustituirse por respuestas de una API.
 */
interface ReviewStore {
  reviewsByProduct: Record<number, Review[]>
  addReview: (productId: number, review: Review) => void
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviewsByProduct: INITIAL_REVIEWS,

  addReview: (productId, review) =>
    set((state) => ({
      reviewsByProduct: {
        ...state.reviewsByProduct,
        [productId]: [review, ...(state.reviewsByProduct[productId] ?? [])],
      },
    })),
}))
