import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentViews } from '@/00-director-acceso'
import { registerDemoData } from '@/84-pipeline-persistencia-demo/00-director-persistencia-demo'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { approveReviewsApi, deleteReviewApi, fetchReviews, rejectReviewApi } from './04-resenas.api'
import type { ProductReview } from './03-types'

/**
 * Comentarios de productos a moderar. Desde L17 la fuente es la API y esto es su caché: el Front Office
 * crea cada comentario «pendiente» en el servidor y solo muestra los aprobados. Aprobar, rechazar y
 * eliminar son optimistas y se revierten con un aviso si el servidor los rechaza (patrón L04). El
 * moderador lo fija el servidor con el usuario de la sesión (`by` se conserva por la firma).
 */
interface ReviewsState {
  reviews: ProductReview[]
  approve: (ids: string[], by: string) => void
  reject: (id: string, by: string, reason: string) => void
  /** Eliminación definitiva (deja de existir también en el Front Office). */
  remove: (id: string) => void
  reset: () => void
}

/** v0: comentarios de demostración en el navegador · v1 (L17): los comentarios viven en la API. */
const REVIEWS_SCHEMA_VERSION = 1

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

const moderate = (r: ProductReview, status: ProductReview['status'], by: string, reason = ''): ProductReview => ({
  ...r, status, moderatedBy: by, moderatedAt: new Date().toISOString(), rejectReason: reason,
})

/** Reemplaza en la caché las reseñas que devolvió el servidor. */
const withSaved = (reviews: ProductReview[], saved: ProductReview[]) => {
  const byId = new Map(saved.map((r) => [r.id, r]))
  return reviews.map((r) => byId.get(r.id) ?? r)
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],

      approve: (ids, by) => {
        const previous = get().reviews.filter((r) => ids.includes(r.id))
        if (previous.length === 0) return
        set((s) => ({ reviews: s.reviews.map((r) => (ids.includes(r.id) ? moderate(r, 'aprobado', by) : r)) }))
        approveReviewsApi(ids)
          .then((saved) => set((s) => ({ reviews: withSaved(s.reviews, saved) })))
          .catch((error: unknown) => {
            set((s) => ({ reviews: withSaved(s.reviews, previous) }))
            toast(`No se publicó: ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
      },

      reject: (id, by, reason) => {
        const previous = get().reviews.find((r) => r.id === id)
        if (!previous) return
        set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? moderate(r, 'rechazado', by, reason) : r)) }))
        rejectReviewApi(id, reason)
          .then((saved) => set((s) => ({ reviews: withSaved(s.reviews, [saved]) })))
          .catch((error: unknown) => {
            set((s) => ({ reviews: withSaved(s.reviews, [previous]) }))
            toast(`No se rechazó el comentario ${id}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
      },

      remove: (id) => {
        const { reviews } = get()
        const index = reviews.findIndex((r) => r.id === id)
        const review = reviews[index]
        if (!review) return
        set({ reviews: reviews.filter((r) => r.id !== id) })
        deleteReviewApi(id).catch((error: unknown) => {
          set((s) => ({ reviews: [...s.reviews.slice(0, index), review, ...s.reviews.slice(index)] }))
          toast(`No se eliminó el comentario ${id}: ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      // Mantenimiento: se relee de la API (no hay datos de fábrica que restaurar).
      reset: () => {
        void loadReviews()
      },
    }),
    {
      name: STORAGE_KEYS.INTERACTIONS,
      partialize: (s) => ({ reviews: s.reviews }),
      version: REVIEWS_SCHEMA_VERSION,
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ reviews: [] as ProductReview[] }),
    },
  ),
)

/**
 * Lee la bandeja (al iniciar o restaurar la sesión y al abrir Comentarios, porque llegan nuevos desde
 * la tienda), solo con la vista Interacciones (la que la API acepta).
 */
export async function loadReviews(): Promise<void> {
  if (!getCurrentViews().includes('interacciones')) return
  try {
    useReviewsStore.setState({ reviews: await fetchReviews() })
  } catch (error) {
    toast(`No se pudieron cargar los comentarios: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadReviews())

// Participa en el respaldo JSON y en el restablecimiento (Ajustes › Mantenimiento).
registerDemoData({
  key: 'productReviews',
  reset: () => useReviewsStore.getState().reset(),
  snapshot: () => useReviewsStore.getState().reviews,
})

/** Comentarios pendientes de moderar (badge del sidebar). */
export const usePendingReviewsCount = (): number => useReviewsStore((s) => s.reviews.filter((r) => r.status === 'pendiente').length)
