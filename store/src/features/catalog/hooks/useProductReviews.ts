import { useMemo } from 'react'
import { isPublished } from '../lib/reviews.api'
import { DEFAULT_REVIEWS } from '../mocks/reviews.mock'
import { useReviewStore } from '../reviews.store'

/**
 * Reseñas PUBLICADAS del producto y distribución de estrellas memoizada.
 * Las pendientes de moderación (o rechazadas) nunca se muestran ni cuentan.
 * TODO(API): con backend, el servidor ya devuelve solo las aprobadas (`?status=aprobado`).
 */
export const useProductReviews = (productId: number) => {
  const storedReviews = useReviewStore((state) => state.reviewsByProduct[productId])
  const published = useMemo(() => (storedReviews ?? []).filter(isPublished), [storedReviews])
  const reviews = published.length > 0 ? published : DEFAULT_REVIEWS

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((review) => review.rating === stars).length
        return {
          stars,
          count,
          percent: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
        }
      }),
    [reviews],
  )

  return { reviews, distribution }
}
