import type { Review } from '@/00-director-modelos'
import { aReview, type ResenaApi } from './02-adaptadores'
import { enviar, obtenerTodas } from './01-cliente-api'

/** Datos que captura el formulario «Escribe tu opinión» (= `ReviewSubmission`). */
export interface OpinionApi {
  rating: number
  author: string
  city: string
  comment: string
}

/** Reseñas publicadas de un producto (la API solo devuelve las aprobadas, las más recientes primero). */
export async function obtenerResenas(productId: number): Promise<Review[]> {
  return (await obtenerTodas<ResenaApi>(`/tienda/productos/${productId}/resenas`)).map(aReview)
}

/**
 * Envía una opinión: el servidor la guarda «pendiente» hasta que el admin la apruebe. Solo viajan los
 * campos del formulario; estado, verificación y fechas los decide el servidor.
 */
export async function enviarResena(productId: number, data: OpinionApi): Promise<void> {
  await enviar(`/tienda/productos/${productId}/resenas`, {
    calificacion: data.rating,
    autor: data.author,
    ciudad: data.city,
    comentario: data.comment,
  })
}
