import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { ProductReview, ReviewStatus } from './03-types'

/**
 * Adaptador de reseñas (L17): `/admin/resenas` ↔ `ProductReview` del admin (D-14, D-19). El moderador, la
 * fecha y el motivo los guarda el servidor con el usuario de la sesión. El id del admin es `REV-###`; el
 * id numérico de la API se recuerda aquí para moderar y eliminar.
 */

type EstadoResena = 'pendiente' | 'aprobada' | 'rechazada'

interface ResenaDto {
  id: number
  producto: { id: number | null; sku: string; nombre: string }
  autor: string
  ciudad: string
  calificacion: number
  comentario: string
  estado: EstadoResena
  creadoEn: string
  moderadoPor: string | null
  moderadoEn: string | null
  motivoRechazo: string
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const pad = (n: number) => String(n).padStart(3, '0')

const STATUS: Record<EstadoResena, ReviewStatus> = { pendiente: 'pendiente', aprobada: 'aprobado', rechazada: 'rechazado' }

/** REV-### → id de la API. */
const apiIds = new Map<string, number>()

const toReview = (dto: ResenaDto): ProductReview => {
  const id = `REV-${pad(dto.id)}`
  apiIds.set(id, dto.id)
  return {
    id,
    // Si el producto se eliminó, la reseña conserva el nombre del snapshot pero ya no apunta al catálogo.
    productId: dto.producto.id === null ? '' : `PRD-${pad(dto.producto.id)}`,
    productName: dto.producto.nombre,
    author: dto.autor,
    city: dto.ciudad,
    rating: dto.calificacion,
    comment: dto.comentario,
    createdAt: dto.creadoEn,
    status: STATUS[dto.estado],
    moderatedBy: dto.moderadoPor,
    moderatedAt: dto.moderadoEn,
    rejectReason: dto.motivoRechazo,
  }
}

const apiId = (reviewId: string) => {
  const id = apiIds.get(reviewId)
  if (id === undefined) throw new Error(`El comentario ${reviewId} no está cargado: recarga Comentarios.`)
  return id
}

/** Toda la bandeja, de 100 en 100 (el admin filtra y ordena en el cliente). */
export async function fetchReviews(): Promise<ProductReview[]> {
  const reviews: ProductReview[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<ResenaDto>>('/admin/resenas', { params: { limit: 100, page } })
    reviews.push(...data.data.map(toReview))
    if (page >= data.meta.totalPages) return reviews
  }
}

/** Aprueba una (estado) o varias («Aprobar N visibles», una sola transacción en el servidor). */
export async function approveReviewsApi(reviewIds: string[]): Promise<ProductReview[]> {
  if (reviewIds.length === 1) {
    const { data } = await apiClient.patch<Envelope<ResenaDto>>(`/admin/resenas/${apiId(reviewIds[0]!)}/estado`, { estado: 'aprobada' })
    return [toReview(data.data)]
  }
  const { data } = await apiClient.post<Envelope<ResenaDto[]>>('/admin/resenas/aprobacion', { ids: reviewIds.map(apiId) })
  return data.data.map(toReview)
}

/** Rechaza u oculta con motivo interno (≥ 3 caracteres). */
export async function rejectReviewApi(reviewId: string, reason: string): Promise<ProductReview> {
  const { data } = await apiClient.patch<Envelope<ResenaDto>>(`/admin/resenas/${apiId(reviewId)}/estado`, { estado: 'rechazada', motivo: reason })
  return toReview(data.data)
}

/** Eliminación definitiva. */
export async function deleteReviewApi(reviewId: string): Promise<void> {
  await apiClient.delete(`/admin/resenas/${apiId(reviewId)}`)
  apiIds.delete(reviewId)
}
