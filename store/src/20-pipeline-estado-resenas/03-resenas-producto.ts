import { useEffect, useMemo } from 'react'
import { isPublished } from './01-contrato-resenas'
import { useReviewStore } from './02-resenas.store'

/**
 * Reseñas PUBLICADAS del producto y distribución de estrellas memoizada. Se piden a la API al abrir
 * la ficha (L17), que solo devuelve las aprobadas: las pendientes o rechazadas nunca se muestran ni cuentan.
 */
export const useProductReviews = (productId: number) => {
  const storedReviews = useReviewStore((state) => state.reviewsByProduct[productId])
  const loadReviews = useReviewStore((state) => state.loadReviews)
  const reviews = useMemo(() => (storedReviews ?? []).filter(isPublished), [storedReviews])

  useEffect(() => {
    if (productId > 0) void loadReviews(productId)
  }, [productId, loadReviews])

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
