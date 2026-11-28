import type { Review } from '@/00-director-modelos'

/**
 * Reseñas (L17): la API es la fuente (`38-pipeline-datos-api/07-resenas.api`).
 *
 * Flujo acordado con el back office:
 *  1. El cliente envía su opinión → el servidor la guarda «pendiente».
 *  2. El back office (/admin › Comentarios) la aprueba, rechaza o elimina.
 *  3. El Front Office solo lista las aprobadas (`GET /tienda/productos/:id/resenas`).
 */

/** Datos que captura el formulario "Escribe tu opinión". */
export interface ReviewSubmission {
  rating: number
  author: string
  city: string
  comment: string
}

/** Solo lo publicado es visible para los clientes (la API ya devuelve solo las aprobadas). */
export const isPublished = (review: Review): boolean => (review.status ?? 'aprobado') === 'aprobado'
