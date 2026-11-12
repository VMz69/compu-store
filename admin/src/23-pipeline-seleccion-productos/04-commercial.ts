/**
 * Resumen comercial en vivo de la sección "Precios y Costos".
 *
 * Supuestos de negocio (El Salvador):
 * - `price` es el precio al consumidor final con IVA incluido.
 * - `cost` es el costo de adquisición sin IVA (crédito fiscal recuperable).
 * - El margen se calcula sobre el precio neto (sin IVA) para no inflarlo.
 * - El descuento visible se deriva de `originalPrice` vs `price`; no se
 *   captura a mano para evitar que ambos datos se contradigan.
 */
export interface CommercialSummary {
  netPrice: number
  taxAmount: number
  /** `null` si no hay costo registrado. */
  margin: number | null
  marginPercent: number | null
  discountPercent: number | null
  isNegativeMargin: boolean
}

const parse = (value: string): number | null => {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function getCommercialSummary(values: {
  cost: string
  price: string
  originalPrice: string
  taxRate: string
}): CommercialSummary {
  const price = parse(values.price) ?? 0
  const cost = parse(values.cost)
  const previous = parse(values.originalPrice)
  const tax = Math.max(0, parse(values.taxRate) ?? 0)

  const netPrice = price / (1 + tax / 100)
  const margin = cost === null ? null : netPrice - cost
  const marginPercent = margin === null || netPrice <= 0 ? null : (margin / netPrice) * 100
  const discountPercent =
    previous !== null && previous > price && price > 0 ? ((previous - price) / previous) * 100 : null

  return {
    netPrice,
    taxAmount: price - netPrice,
    margin,
    marginPercent,
    discountPercent,
    isNegativeMargin: margin !== null && margin < 0,
  }
}
