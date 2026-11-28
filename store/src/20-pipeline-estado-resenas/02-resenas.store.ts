import { create } from 'zustand'
import { enviarResena, obtenerResenas } from '@/38-pipeline-datos-api/00-director-datos-api'
import type { ReviewSubmission } from './01-contrato-resenas'
import type { Review } from '@/00-director-modelos'

/**
 * Reseñas publicadas por producto (L17): se piden a la API al abrir cada ficha, sin caché entre
 * visitas. Una opinión nueva se envía al servidor, que la guarda «pendiente» y NO se muestra hasta
 * que el back office (/admin › Comentarios) la apruebe: nada se guarda en el navegador.
 */
interface ReviewStore {
  reviewsByProduct: Record<number, Review[]>
  /** Relee las aprobadas del producto; si la API falla, se conservan las que hay (sin aviso). */
  loadReviews: (productId: number) => Promise<void>
  /** Envía la opinión a moderación; lanza el error de la API (límite de envíos, conexión…). */
  submitReview: (productId: number, data: ReviewSubmission) => Promise<void>
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviewsByProduct: {},

  loadReviews: async (productId) => {
    try {
      const reviews = await obtenerResenas(productId)
      set((state) => ({ reviewsByProduct: { ...state.reviewsByProduct, [productId]: reviews } }))
    } catch {
      // Se mantiene lo que ya se mostraba: las reseñas no bloquean la ficha.
    }
  },

  submitReview: (productId, data) => enviarResena(productId, data),
}))
