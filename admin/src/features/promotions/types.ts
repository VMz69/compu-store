/** "percent" = % de descuento sobre el precio base · "amount" = monto fijo en $ (IVA incluido). */
export type DiscountType = 'percent' | 'amount'

/**
 * Oferta: regla de precio con vigencia sobre productos concretos. No modifica el
 * precio del producto: el precio vigente se calcula al vuelo (capa de precios).
 */
export interface Offer {
  id: string
  title: string
  /** Etiqueta corta para el banner (ej. "OFERTA GAMER"). */
  badge: string
  description: string
  productIds: string[]
  discountType: DiscountType
  /** % (1–90) o $ según `discountType`. */
  discountValue: number
  /** Fechas locales "YYYY-MM-DD" (ambas inclusive). */
  startDate: string
  endDate: string
  /** Pausa manual: deja de aplicar aunque esté dentro de su vigencia. */
  paused: boolean
  createdAt: string
}

export type OfferDraft = Omit<Offer, 'id' | 'createdAt'> & { id?: string }

/** Estado derivado de las fechas y la pausa (no se guarda). */
export type OfferStatus = 'vigente' | 'programada' | 'pausada' | 'vencida'
