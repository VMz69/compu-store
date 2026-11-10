/**
 * Moderación de comentarios de productos que los clientes dejan en el Front Office.
 * Flujo: pendiente → aprobado (se publica) | rechazado (no se publica). Eliminar lo
 * quita definitivamente.
 */
export type ReviewStatus = 'pendiente' | 'aprobado' | 'rechazado'

/**
 * Campos capturados por el formulario "Escribe tu opinión" de la ficha de producto
 * del Front Office: calificación, nombre, ciudad o localidad y comentario.
 */
export interface ProductReview {
  id: string
  /** Id del producto del catálogo (ej. "PRD-001"). */
  productId: string
  /** Nombre del producto al comentar (snapshot por si el producto cambia o se elimina). */
  productName: string
  /** "Tu Nombre". */
  author: string
  /** "Ciudad o Localidad" (el Front Office usa "El Salvador" si se deja vacía). */
  city: string
  /** "Tu calificación": 1–5 estrellas. */
  rating: number
  /** "Tu Comentario u Opinión". */
  comment: string
  /** Fecha ISO en que el cliente dejó el comentario. */
  createdAt: string
  status: ReviewStatus
  /** Quién y cuándo aprobó/rechazó (null mientras está pendiente). */
  moderatedBy: string | null
  moderatedAt: string | null
  /** Motivo del rechazo (visible solo en el back office). */
  rejectReason: string
}
