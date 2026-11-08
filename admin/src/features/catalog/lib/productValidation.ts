import type { Product } from '../types'
import type { ProductFormTab, ProductFormValues } from './productForm'

/**
 * Errores por ruta de campo. Las filas usan rutas compuestas:
 * `specs.<rowId>.key`, `lots.<rowId>.lotNumber`, etc.
 */
export type ProductFormErrors = Record<string, string>

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,31}$/

const isBlank = (value: string) => value.trim() === ''
const num = (value: string) => Number(value)

/**
 * Valida el formulario completo (las 4 secciones a la vez).
 *
 * Se usa validación propia en lugar de la nativa del navegador (`required`)
 * porque los campos de secciones ocultas no pueden recibir foco y el navegador
 * bloquearía el envío sin mostrar el mensaje.
 */
export function validateProduct(v: ProductFormValues, products: Product[]): ProductFormErrors {
  const e: ProductFormErrors = {}

  // General
  if (v.name.trim().length < 3) e.name = 'Ingresa un nombre de al menos 3 caracteres.'
  if (!v.category) e.category = 'Selecciona una categoría.'
  if (isBlank(v.brand)) e.brand = 'Indica la marca.'
  const sku = v.sku.trim().toUpperCase()
  if (sku && !SKU_PATTERN.test(sku)) e.sku = 'Usa letras, números y guiones (2–32 caracteres).'
  else if (sku && products.some((p) => p.sku.toUpperCase() === sku && p.id !== v.id)) {
    e.sku = 'Este SKU ya está asignado a otro producto.'
  }

  // Precios y costos
  if (isBlank(v.price) || !(num(v.price) > 0)) e.price = 'El precio de venta debe ser mayor a 0.'
  if (!isBlank(v.cost) && num(v.cost) < 0) e.cost = 'El costo no puede ser negativo.'
  if (!isBlank(v.originalPrice) && num(v.originalPrice) <= num(v.price)) {
    e.originalPrice = 'Debe ser mayor al precio de venta para mostrarse como ahorro.'
  }
  if (isBlank(v.taxRate) || num(v.taxRate) < 0 || num(v.taxRate) > 100) e.taxRate = 'Entre 0 y 100.'

  // Especificaciones: una fila a medio llenar es un error; una vacía se ignora.
  for (const row of v.specs) {
    if (isBlank(row.key) !== isBlank(row.value)) {
      e[`specs.${row.id}.${isBlank(row.key) ? 'key' : 'value'}`] = 'Completa clave y valor.'
    }
  }

  // Inventario y lotes
  if (!v.lotControl && (isBlank(v.stock) || num(v.stock) < 0)) e.stock = 'Ingresa 0 o más unidades.'
  if (isBlank(v.reorderPoint) || num(v.reorderPoint) < 0) e.reorderPoint = 'Ingresa 0 o más.'
  if (v.lotControl) {
    for (const lot of v.lots) {
      if (isBlank(lot.lotNumber)) e[`lots.${lot.id}.lotNumber`] = 'Requerido.'
      if (isBlank(lot.quantity) || num(lot.quantity) < 0) e[`lots.${lot.id}.quantity`] = '0 o más.'
      if (!lot.noExpiry && isBlank(lot.expiresAt)) e[`lots.${lot.id}.expiresAt`] = 'Fecha o "No vence".'
    }
  }

  return e
}

/** Sección a la que pertenece cada campo raíz (para marcar tabs con error). */
const FIELD_TAB: Record<string, ProductFormTab> = {
  name: 'general', category: 'general', brand: 'general', sku: 'general', model: 'general',
  price: 'pricing', cost: 'pricing', originalPrice: 'pricing', taxRate: 'pricing',
  specs: 'specs',
  stock: 'logistics', reorderPoint: 'logistics', lots: 'logistics',
}

export const tabOfError = (path: string): ProductFormTab => FIELD_TAB[path.split('.')[0]] ?? 'general'

/** Número de errores por sección, para los indicadores en las tabs. */
export function countErrorsByTab(errors: ProductFormErrors): Record<ProductFormTab, number> {
  const counts: Record<ProductFormTab, number> = { general: 0, pricing: 0, specs: 0, logistics: 0 }
  for (const path of Object.keys(errors)) counts[tabOfError(path)] += 1
  return counts
}
