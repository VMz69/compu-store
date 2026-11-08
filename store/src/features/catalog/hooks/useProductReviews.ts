import { useMemo } from 'react'
import { DEFAULT_REVIEWS } from '../mocks/reviews.mock'
import { useReviewStore } from '../reviews.store'

/**
 * Reseñas del producto y distribución de estrellas memoizada.
 */
export const useProductReviews = (productId: number) => {
  const storedReviews = useReviewStore((state) => state.reviewsByProduct[productId])
  const reviews = storedReviews && storedReviews.length > 0 ? storedReviews : DEFAULT_REVIEWS

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
