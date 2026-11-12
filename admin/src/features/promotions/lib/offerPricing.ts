import { toLocalISO } from '@/71-pipeline-seleccion-fechas/05-date'
import { money } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'
import type { Product } from '@/00-director-catalogo'
import type { DiscountType, Offer, OfferStatus } from '../types'

/**
 * Lógica pura de ofertas (sin React ni store).
 * Supuestos (igual que el formulario de productos): `price` incluye IVA, `cost` no;
 * el margen se mide sobre el precio sin IVA.
 */

/** Margen mínimo recomendado: por debajo se advierte (no se bloquea). */
export const MIN_MARGIN_PERCENT = 5

/** Fecha local de hoy "YYYY-MM-DD" (helper compartido; acepta una fecha para pruebas). */
export const today = (date = new Date()): string => toLocalISO(date)

export function offerStatus(offer: Pick<Offer, 'startDate' | 'endDate' | 'paused'>, now = today()): OfferStatus {
  if (offer.endDate < now) return 'vencida'
  if (offer.paused) return 'pausada'
  return offer.startDate > now ? 'programada' : 'vigente'
}

export const OFFER_STATUS_META: Record<OfferStatus, { label: string; tone: 'success' | 'brand' | 'warning' | 'neutral' }> = {
  vigente: { label: 'Vigente', tone: 'success' },
  programada: { label: 'Programada', tone: 'brand' },
  pausada: { label: 'Pausada', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'neutral' },
}

/** Descuento legible para listas y búsqueda: "15%" o "$25.00". */
export const discountText = (offer: Pick<Offer, 'discountType' | 'discountValue'>): string =>
  offer.discountType === 'percent' ? `${offer.discountValue}%` : `$${offer.discountValue.toFixed(2)}`

/** Precio con el descuento aplicado (nunca negativo). */
export const discountedPrice = (base: number, type: DiscountType, value: number): number =>
  money(Math.max(0, type === 'percent' ? base * (1 - value / 100) : base - value))

export type MarginLevel = 'ok' | 'low' | 'below_cost' | 'no_cost'

export interface ProductOfferAnalysis {
  product: Product
  basePrice: number
  offerPrice: number
  saving: number
  savingPercent: number
  /** Margen en $ y % sobre el precio sin IVA; null si el producto no tiene costo. */
  margin: number | null
  marginPercent: number | null
  level: MarginLevel
}

export function analyzeProduct(product: Product, type: DiscountType, value: number): ProductOfferAnalysis {
  const offerPrice = discountedPrice(product.price, type, value)
  const net = offerPrice / (1 + product.taxRate / 100)
  const margin = product.cost === null ? null : money(net - product.cost)
  const marginPercent = margin === null || net <= 0 ? null : (margin / net) * 100
  const level: MarginLevel =
    margin === null ? 'no_cost' : margin < 0 ? 'below_cost' : (marginPercent ?? 0) < MIN_MARGIN_PERCENT ? 'low' : 'ok'
  const saving = money(product.price - offerPrice)
  return {
    product, basePrice: product.price, offerPrice, saving,
    savingPercent: product.price > 0 ? (saving / product.price) * 100 : 0,
    margin, marginPercent, level,
  }
}

/** Ofertas que aplican hoy (no pausadas y dentro de su vigencia). */
export const runningOffers = (offers: Offer[], now = today()) => offers.filter((o) => offerStatus(o, now) === 'vigente')

/** Precio vigente del producto: el de su oferta vigente, o el base. */
export function effectivePrice(product: Product, offers: Offer[], now = today()): { price: number; offer: Offer | null } {
  const offer = runningOffers(offers, now).find((o) => o.productIds.includes(product.id)) ?? null
  return offer ? { price: discountedPrice(product.price, offer.discountType, offer.discountValue), offer } : { price: product.price, offer: null }
}

/** Otra oferta no vencida que comparte productos y fechas con esta (regla: sin solapamientos). */
export function findOverlap(draft: Pick<Offer, 'productIds' | 'startDate' | 'endDate'> & { id?: string }, offers: Offer[], now = today()) {
  for (const o of offers) {
    if (o.id === draft.id || offerStatus(o, now) === 'vencida') continue
    if (o.startDate > draft.endDate || o.endDate < draft.startDate) continue
    const shared = draft.productIds.filter((id) => o.productIds.includes(id))
    if (shared.length) return { offer: o, productIds: shared }
  }
  return null
}

export interface OfferFormInput {
  id?: string
  title: string
  discountType: DiscountType
  discountValue: number
  startDate: string
  endDate: string
  productIds: string[]
}

export function validateOffer(v: OfferFormInput, analyses: ProductOfferAnalysis[], offers: Offer[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (v.title.trim().length < 3) e.title = 'Ingresa un nombre (mín. 3 caracteres).'
  if (!Number.isFinite(v.discountValue) || v.discountValue <= 0) e.discountValue = 'El descuento debe ser mayor que 0.'
  else if (v.discountType === 'percent' && v.discountValue > 90) e.discountValue = 'Máximo 90%.'
  if (!v.startDate || !v.endDate) e.dates = 'Indica la fecha de inicio y de fin.'
  else if (v.endDate < v.startDate) e.dates = 'La fecha de fin debe ser igual o posterior al inicio.'
  else if (!v.id && v.endDate < today()) e.dates = 'La oferta terminaría en el pasado.'
  if (v.productIds.length === 0) e.products = 'Agrega al menos un producto.'
  const belowCost = analyses.filter((a) => a.level === 'below_cost')
  if (belowCost.length) e.products = `${belowCost.length} producto(s) quedarían bajo su costo. Baja el descuento o quítalos.`
  const overlap = !e.dates && v.productIds.length ? findOverlap(v, offers) : null
  if (overlap) e.products = `${overlap.productIds.length} producto(s) ya están en "${overlap.offer.title}" en esas fechas.`
  return e
}
