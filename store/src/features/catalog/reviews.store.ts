import { create } from 'zustand'
import { buildPendingReview, type ReviewSubmission } from './lib/reviews.api'
import { INITIAL_REVIEWS } from './mocks/reviews.mock'
import type { Review } from '@/00-director-modelos'

/**
 * Reseñas por producto. En esta fase viven en memoria (se pierden al recargar).
 *
 * Moderación: cada opinión nueva entra como `pendiente` y NO se muestra hasta que el
 * back office (/admin › Comentarios) la apruebe. Ver contrato en `lib/reviews.api.ts`.
 *
 * TODO(API): cuando exista el backend,
 *  · `reviewsByProduct` se carga con `fetchApprovedReviews(productId)` (solo aprobadas);
 *  · `submitReview` llama a `submitReview()` de la API y ya no guarda localmente
 *    (la opinión pendiente vive en el servidor, no en el navegador del cliente).
 */
interface ReviewStore {
  reviewsByProduct: Record<number, Review[]>
  /** Envía la opinión a moderación (queda `pendiente`). */
  submitReview: (productId: number, data: ReviewSubmission) => Review
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviewsByProduct: INITIAL_REVIEWS,

  submitReview: (productId, data) => {
    // TODO(API): reemplazar por `await submitReview(productId, data)` (lib/reviews.api.ts).
    const review = buildPendingReview(data)
    set((state) => ({
      reviewsByProduct: {
        ...state.reviewsByProduct,
        [productId]: [review, ...(state.reviewsByProduct[productId] ?? [])],
      },
    }))
    return review
  },
}))
