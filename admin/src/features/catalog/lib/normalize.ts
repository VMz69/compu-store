import type { Product, ProductCondition, ProductLot, ProductSpec } from '../types'

/** Punto de reorden por defecto (equivale al umbral global que existía antes). */
export const DEFAULT_REORDER_POINT = 3

/** IVA de El Salvador incluido en el precio al consumidor final. */
export const DEFAULT_TAX_RATE = 13

const CONDITIONS: ProductCondition[] = ['nuevo', 'usado', 'reacondicionado']

/** Suma de existencias de los lotes. */
export const sumLots = (lots: ProductLot[]): number =>
  lots.reduce((acc, lot) => acc + Math.max(0, lot.quantity), 0)

/**
 * Acepta especificaciones en el formato actual ({ key, value }) o en el
 * formato anterior (string plano) y las devuelve siempre como clave/valor.
 */
const normalizeSpecs = (specs: unknown): ProductSpec[] => {
  if (!Array.isArray(specs)) return []
  return specs.map((spec) =>
    typeof spec === 'string' ? { key: 'Detalle', value: spec } : (spec as ProductSpec),
  )
}

/**
 * Completa un producto con los campos introducidos en el modal de 4 secciones.
 *
 * Se usa en dos lugares:
 * - Migración del store persistido (datos guardados en localStorage con el
 *   modelo anterior, que no tenía SKU, costo, lotes, etc.).
 * - Construcción de los mocks, para no repetir valores por defecto.
 */
export function normalizeProduct(raw: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
  const lots = raw.lots ?? []
  const lotControl = Boolean(raw.lotControl) && lots.length > 0
  return {
    sku: raw.sku || raw.id,
    slug: raw.slug ?? '',
    brand: raw.brand ?? '',
    model: raw.model ?? '',
    condition: CONDITIONS.includes(raw.condition as ProductCondition) ? raw.condition! : 'nuevo',
    category: raw.category ?? '',
    cost: raw.cost ?? null,
    price: raw.price ?? 0,
    originalPrice: raw.originalPrice ?? null,
    taxRate: raw.taxRate ?? DEFAULT_TAX_RATE,
    reorderPoint: raw.reorderPoint ?? DEFAULT_REORDER_POINT,
    active: raw.active ?? true,
    badge: raw.badge ?? null,
    rating: raw.rating ?? 5,
    imageUrl: raw.imageUrl ?? '',
    description: raw.description ?? '',
    compatibility: raw.compatibility ?? '',
    connectivity: raw.connectivity ?? '',
    ...raw,
    specs: normalizeSpecs(raw.specs),
    lotControl,
    lots,
    // Con control de lotes, el stock siempre se deriva de los lotes.
    stock: lotControl ? sumLots(lots) : (raw.stock ?? 0),
  }
}
