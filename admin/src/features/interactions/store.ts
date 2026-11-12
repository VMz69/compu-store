import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { registerDemoData } from '@/84-pipeline-persistencia-demo/00-director-persistencia-demo'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { REVIEWS_MOCK } from '../../86-pipeline-datos-demo-personas/04-reviews.mock'
import type { ProductReview } from './types'

/**
 * Comentarios de productos a moderar.
 *
 * ⚠️ Integración pendiente: el Front Office (/store) y este back office son apps
 * separadas y aún no comparten backend (/api está vacío). Cuando exista la API:
 *  · el Front Office crea cada comentario con `status: 'pendiente'`;
 *  · solo muestra los `aprobado`;
 *  · estas acciones pasan a ser llamadas a la API (misma firma).
 */
interface ReviewsState {
  reviews: ProductReview[]
  approve: (ids: string[], by: string) => void
  reject: (id: string, by: string, reason: string) => void
  /** Eliminación definitiva (deja de existir también en el Front Office). */
  remove: (id: string) => void
  reset: () => void
}

const moderate = (r: ProductReview, status: ProductReview['status'], by: string, reason = ''): ProductReview => ({
  ...r, status, moderatedBy: by, moderatedAt: new Date().toISOString(), rejectReason: reason,
})

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      reviews: REVIEWS_MOCK,
      approve: (ids, by) => set((s) => ({ reviews: s.reviews.map((r) => (ids.includes(r.id) ? moderate(r, 'aprobado', by) : r)) })),
      reject: (id, by, reason) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? moderate(r, 'rechazado', by, reason) : r)) })),
      remove: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      reset: () => set({ reviews: REVIEWS_MOCK }),
    }),
    { name: STORAGE_KEYS.INTERACTIONS, partialize: (s) => ({ reviews: s.reviews }) },
  ),
)

// Participa en el respaldo JSON y en el restablecimiento de fábrica (Ajustes › Mantenimiento).
registerDemoData({
  key: 'productReviews',
  reset: () => useReviewsStore.getState().reset(),
  snapshot: () => useReviewsStore.getState().reviews,
})

/** Comentarios pendientes de moderar (badge del sidebar). */
export const usePendingReviewsCount = (): number => useReviewsStore((s) => s.reviews.filter((r) => r.status === 'pendiente').length)
