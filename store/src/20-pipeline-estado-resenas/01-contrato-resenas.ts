import type { Review } from '@/00-director-modelos'

/**
 * Contrato de la futura API de reseñas (moderación desde el back office).
 *
 * ⚠️ AÚN NO EXISTE LA API: este archivo documenta lo que se construirá en /api.
 * Hoy las reseñas viven en memoria (`reviews.store.ts`) y el código de red queda
 * comentado. Cuando exista el backend, descomentar y reemplazar las acciones del
 * store por estas llamadas (misma firma).
 *
 * Flujo acordado con el back office:
 *  1. El cliente envía su opinión → se guarda con `status: 'pendiente'`.
 *  2. El back office (/admin › Comentarios) la aprueba, rechaza o elimina.
 *  3. El Front Office solo lista las `aprobado`.
 *
 * Endpoints propuestos:
 *  · GET    /api/products/:productId/reviews?status=aprobado → Review[]   (público)
 *  · POST   /api/products/:productId/reviews                 → Review     (público, crea "pendiente")
 *  · GET    /api/reviews?status=pendiente                    → Review[]   (back office)
 *  · PATCH  /api/reviews/:id { status, rejectReason }         → Review     (back office)
 *  · DELETE /api/reviews/:id                                  → 204        (back office)
 */

/** Datos que captura el formulario "Escribe tu opinión". */
export interface ReviewSubmission {
  rating: number
  author: string
  city: string
  comment: string
}

// const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
//
// /** Reseñas publicadas de un producto (solo aprobadas). */
// export async function fetchApprovedReviews(productId: number): Promise<Review[]> {
//   const res = await fetch(`${API_URL}/api/products/${productId}/reviews?status=aprobado`)
//   if (!res.ok) throw new Error('No se pudieron cargar las opiniones.')
//   return res.json()
// }
//
// /** Envía una opinión: el servidor la guarda como "pendiente" hasta su moderación. */
// export async function submitReview(productId: number, data: ReviewSubmission): Promise<Review> {
//   const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   })
//   if (!res.ok) throw new Error('No se pudo enviar tu opinión. Intenta de nuevo.')
//   return res.json()
// }

/** Reseña nueva tal como la crearía el servidor (mientras no hay API, se arma aquí). */
export const buildPendingReview = (data: ReviewSubmission): Review => ({
  id: Date.now(),
  author: data.author,
  city: data.city || 'El Salvador',
  rating: data.rating,
  date: 'Hace un momento',
  title: 'Opinión de cliente',
  comment: data.comment,
  // La compra no se puede verificar desde el formulario público: la marca la decide el servidor.
  verified: false,
  status: 'pendiente',
})

/** Solo lo publicado es visible para los clientes (las reseñas de muestra no traen estado). */
export const isPublished = (review: Review): boolean => (review.status ?? 'aprobado') === 'aprobado'
