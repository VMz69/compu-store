import { foldText } from '@/shared/lib/text'
import type { BadgeTone } from '@/shared/ui'
import type { ProductReview, ReviewStatus } from '../types'

/** Lógica pura de moderación (sin React ni store). */

export const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; tone: BadgeTone; icon: string }> = {
  pendiente: { label: 'Pendiente', tone: 'warning', icon: 'fa-solid fa-hourglass-half' },
  aprobado: { label: 'Publicado', tone: 'success', icon: 'fa-solid fa-circle-check' },
  rechazado: { label: 'Rechazado', tone: 'danger', icon: 'fa-solid fa-ban' },
}

/** Motivos frecuentes de rechazo (atajos en el diálogo). */
export const REJECT_REASONS = ['Spam o publicidad', 'Lenguaje ofensivo', 'Sin contenido útil', 'No corresponde al producto'] as const

/** Señales simples de posible spam para priorizar la revisión (no rechaza solo). */
export function spamSignals(r: Pick<ProductReview, 'comment'>): string[] {
  const text = r.comment
  const signals: string[] = []
  if (/https?:\/\/|www\.|\.com\b/i.test(text)) signals.push('Contiene enlaces')
  if (/[A-ZÁÉÍÓÚÑ]{6,}/.test(text) && text.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length > text.length * 0.4) signals.push('Exceso de mayúsculas')
  if (r.comment.trim().length < 10) signals.push('Comentario muy corto')
  return signals
}

export interface ReviewQuery {
  status: 'all' | ReviewStatus
  search: string
  rating: number | null
}

/** Pendientes primero (lo que requiere acción) y luego los más recientes. */
export function filterReviews(reviews: ProductReview[], { status, search, rating }: ReviewQuery): ProductReview[] {
  const term = foldText(search)
  return reviews
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => rating === null || r.rating === rating)
    .filter((r) => !term || [r.productName, r.productId, r.author, r.city, r.comment].some((f) => foldText(f).includes(term)))
    .sort((a, b) => Number(b.status === 'pendiente') - Number(a.status === 'pendiente') || b.createdAt.localeCompare(a.createdAt))
}

export function reviewMetrics(reviews: ProductReview[]) {
  const published = reviews.filter((r) => r.status === 'aprobado')
  return {
    pending: reviews.filter((r) => r.status === 'pendiente').length,
    published: published.length,
    rejected: reviews.filter((r) => r.status === 'rechazado').length,
    /** Promedio de estrellas de lo publicado (lo que ve el cliente). */
    avgRating: published.length ? published.reduce((acc, r) => acc + r.rating, 0) / published.length : null,
  }
}
