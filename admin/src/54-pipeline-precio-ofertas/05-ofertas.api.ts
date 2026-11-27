import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { DiscountType, Offer, OfferDraft } from './04-types'

/**
 * Adaptador de ofertas (L12): `/admin/ofertas` ↔ `Offer` del admin (D-14, D-19).
 * El servidor valida (bajo costo, solapamiento, vigencia) y calcula el precio de oferta de
 * cada producto con la misma fórmula que la tienda y el carrito; aquí solo se traduce.
 */

type TipoDescuento = 'porcentaje' | 'monto'

interface OfertaDto {
  id: number
  titulo: string
  etiqueta: string
  descripcion: string
  tipoDescuento: TipoDescuento
  valor: string
  inicio: string
  fin: string
  pausada: boolean
  productos: { productoId: number; precioOferta: string }[]
  creadaEn: string
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const OFFER_PREFIX = 'PRM-'
const PRODUCT_PREFIX = 'PRD-'

/** Ids numéricos de la API ↔ ids del admin `PRM-###` / `PRD-###` (D-04). */
const toOfferId = (id: number) => `${OFFER_PREFIX}${String(id).padStart(3, '0')}`
const toProductId = (id: number) => `${PRODUCT_PREFIX}${String(id).padStart(3, '0')}`
const toApiId = (id: string, prefix: string) => Number(id.slice(prefix.length))

const TO_DISCOUNT: Record<TipoDescuento, DiscountType> = { porcentaje: 'percent', monto: 'amount' }
const TO_TIPO: Record<DiscountType, TipoDescuento> = { percent: 'porcentaje', amount: 'monto' }

const toOffer = (dto: OfertaDto): Offer => ({
  id: toOfferId(dto.id),
  title: dto.titulo,
  badge: dto.etiqueta,
  description: dto.descripcion,
  productIds: dto.productos.map((p) => toProductId(p.productoId)),
  discountType: TO_DISCOUNT[dto.tipoDescuento],
  discountValue: Number(dto.valor),
  startDate: dto.inicio,
  endDate: dto.fin,
  paused: dto.pausada,
  createdAt: dto.creadaEn,
  prices: Object.fromEntries(dto.productos.map((p) => [toProductId(p.productoId), Number(p.precioOferta)])),
})

const toOfertaBody = (draft: Omit<OfferDraft, 'id'>) => ({
  titulo: draft.title,
  etiqueta: draft.badge,
  descripcion: draft.description,
  tipoDescuento: TO_TIPO[draft.discountType],
  valor: String(draft.discountValue),
  inicio: draft.startDate,
  fin: draft.endDate,
  productoIds: draft.productIds.map((id) => toApiId(id, PRODUCT_PREFIX)),
  pausada: draft.paused,
})

/** Todas las ofertas, de 100 en 100 (precarga: el admin filtra y ordena en el cliente). */
export async function fetchOffers(): Promise<Offer[]> {
  const offers: Offer[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<OfertaDto>>('/admin/ofertas', { params: { limit: 100, page } })
    offers.push(...data.data.map(toOffer))
    if (page >= data.meta.totalPages) return offers
  }
}

/** Alta o edición; devuelve la oferta tal como quedó en el servidor. */
export async function saveOfferApi({ id, ...draft }: OfferDraft): Promise<Offer> {
  const body = toOfertaBody(draft)
  const { data } = id
    ? await apiClient.patch<Envelope<OfertaDto>>(`/admin/ofertas/${toApiId(id, OFFER_PREFIX)}`, body)
    : await apiClient.post<Envelope<OfertaDto>>('/admin/ofertas', body)
  return toOffer(data.data)
}

export async function setOfferPausedApi(id: string, paused: boolean): Promise<Offer> {
  const { data } = await apiClient.patch<Envelope<OfertaDto>>(`/admin/ofertas/${toApiId(id, OFFER_PREFIX)}/pausa`, { pausada: paused })
  return toOffer(data.data)
}

export async function deleteOfferApi(id: string): Promise<void> {
  await apiClient.delete(`/admin/ofertas/${toApiId(id, OFFER_PREFIX)}`)
}
