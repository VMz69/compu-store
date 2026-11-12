import { uid } from '@/85-pipeline-identificadores-texto/02-uid'
import type { Category, Product, ProductCondition, ProductDraft } from '../25-pipeline-persistencia-catalogo/04-types'
import { PLACEHOLDER_IMAGE, resolveGallery, toImageRows, type ImageRow } from '../17-pipeline-ficha-producto/03-productImages'
import { DEFAULT_REORDER_POINT, DEFAULT_TAX_RATE } from './03-normalize'

/* ------------------------------------------------------------------ */
/* Secciones (tabs) del modal                                          */
/* ------------------------------------------------------------------ */

export type ProductFormTab = 'general' | 'pricing' | 'specs' | 'logistics'

export const PRODUCT_FORM_TABS: Array<{ id: ProductFormTab; label: string; icon: string }> = [
  { id: 'general', label: 'General', icon: 'fa-solid fa-circle-info' },
  { id: 'pricing', label: 'Precios y Costos', icon: 'fa-solid fa-tags' },
  { id: 'specs', label: 'Especificaciones', icon: 'fa-solid fa-microchip' },
  { id: 'logistics', label: 'Inventario y Lotes', icon: 'fa-solid fa-boxes-stacked' },
]

export const PRODUCT_FORM_TAB_IDS = PRODUCT_FORM_TABS.map((tab) => tab.id)

export const CONDITION_OPTIONS: Array<{ value: ProductCondition; label: string }> = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'reacondicionado', label: 'Reacondicionado' },
  { value: 'usado', label: 'Usado' },
]

/* ------------------------------------------------------------------ */
/* Estado del formulario                                               */
/* ------------------------------------------------------------------ */

/** Fila editable de especificación (el `id` solo sirve como key de React). */
export interface SpecRow {
  id: string
  key: string
  value: string
}

/** Fila editable de lote. Los números se manejan como string mientras se escribe. */
export interface LotRow {
  id: string
  lotNumber: string
  quantity: string
  expiresAt: string
  noExpiry: boolean
}

/**
 * Estado completo del formulario. Los campos numéricos son `string` porque
 * provienen de inputs controlados; se convierten a número en `toDraft`.
 */
export interface ProductFormValues {
  id: string
  sku: string
  name: string
  category: string
  brand: string
  model: string
  condition: ProductCondition
  /** Galería ordenada; la primera fila es la portada. */
  images: ImageRow[]
  active: boolean
  cost: string
  price: string
  originalPrice: string
  taxRate: string
  description: string
  compatibility: string
  connectivity: string
  specs: SpecRow[]
  stock: string
  reorderPoint: string
  lotControl: boolean
  lots: LotRow[]
}

/** Campos de texto/número/select que se enlazan con `bind(...)`. */
export type ProductScalarField = {
  [K in keyof ProductFormValues]: ProductFormValues[K] extends string ? K : never
}[keyof ProductFormValues]

export const emptySpecRow = (): SpecRow => ({ id: uid(), key: '', value: '' })

export const emptyLotRow = (): LotRow => ({
  id: uid(),
  lotNumber: '',
  quantity: '0',
  expiresAt: '',
  noExpiry: false,
})

const numberOrEmpty = (value: number | null): string => (value === null ? '' : String(value))

/** Producto (o null para alta) → estado inicial del formulario. */
export function toFormValues(product: Product | null, categories: Category[]): ProductFormValues {
  const p = product
  return {
    id: p?.id ?? '',
    sku: p?.sku ?? '',
    name: p?.name ?? '',
    category: p?.category ?? categories[0]?.id ?? '',
    brand: p?.brand ?? '',
    model: p?.model ?? '',
    condition: p?.condition ?? 'nuevo',
    images: toImageRows(p ? resolveGallery(p) : []),
    active: p?.active ?? true,
    cost: numberOrEmpty(p?.cost ?? null),
    price: numberOrEmpty(p?.price ?? null),
    originalPrice: numberOrEmpty(p?.originalPrice ?? null),
    taxRate: String(p?.taxRate ?? DEFAULT_TAX_RATE),
    description: p?.description ?? '',
    compatibility: p?.compatibility ?? '',
    connectivity: p?.connectivity ?? '',
    specs: p?.specs.length ? p.specs.map((s) => ({ id: uid(), ...s })) : [emptySpecRow()],
    stock: String(p?.stock ?? 0),
    reorderPoint: String(p?.reorderPoint ?? DEFAULT_REORDER_POINT),
    lotControl: p?.lotControl ?? false,
    lots: p?.lots.length
      ? p.lots.map((lot) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          quantity: String(lot.quantity),
          expiresAt: lot.expiresAt ?? '',
          noExpiry: lot.expiresAt === null,
        }))
      : [emptyLotRow()],
  }
}

const toNumber = (value: string): number => parseFloat(value) || 0
const toOptionalNumber = (value: string): number | null => (value.trim() === '' ? null : toNumber(value))
const toInt = (value: string): number => Math.max(0, parseInt(value, 10) || 0)

/** Suma de cantidades de los lotes del formulario (stock autocalculado). */
export const sumLotRows = (lots: LotRow[]): number => lots.reduce((acc, lot) => acc + toInt(lot.quantity), 0)

/** Estado del formulario → borrador listo para el store. */
export function toDraft(v: ProductFormValues): ProductDraft {
  const lots = v.lotControl
    ? v.lots.map((lot) => ({
        id: lot.id,
        lotNumber: lot.lotNumber.trim(),
        quantity: toInt(lot.quantity),
        expiresAt: lot.noExpiry || !lot.expiresAt ? null : lot.expiresAt,
      }))
    : []
  const images = v.images.map((row) => row.src.trim()).filter(Boolean)
  return {
    id: v.id || undefined,
    sku: v.sku.trim().toUpperCase(),
    name: v.name.trim(),
    category: v.category,
    brand: v.brand.trim(),
    model: v.model.trim(),
    condition: v.condition,
    images,
    imageUrl: images[0] ?? PLACEHOLDER_IMAGE,
    active: v.active,
    cost: toOptionalNumber(v.cost),
    price: toNumber(v.price),
    originalPrice: toOptionalNumber(v.originalPrice),
    taxRate: toNumber(v.taxRate),
    description: v.description.trim(),
    compatibility: v.compatibility.trim(),
    connectivity: v.connectivity.trim(),
    // Se descartan filas vacías: el usuario puede dejar una fila en blanco sin error.
    specs: v.specs
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.key || s.value),
    lotControl: v.lotControl,
    lots,
    stock: v.lotControl ? sumLotRows(v.lots) : toInt(v.stock),
    reorderPoint: toInt(v.reorderPoint),
  }
}
