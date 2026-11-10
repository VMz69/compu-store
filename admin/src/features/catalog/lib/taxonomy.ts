import { foldText, slugify } from '@/shared/lib/text'
import type { Brand, Category, Product } from '../types'

/**
 * Reglas puras de la taxonomía del catálogo (categorías y marcas), sin React ni store.
 */

/** Íconos ofrecidos en el formulario de categoría (evita escribir clases a mano). */
export const CATEGORY_ICONS = [
  'fa-solid fa-laptop', 'fa-solid fa-desktop', 'fa-solid fa-microchip', 'fa-solid fa-memory',
  'fa-solid fa-hard-drive', 'fa-solid fa-headphones', 'fa-solid fa-gamepad', 'fa-solid fa-keyboard',
  'fa-solid fa-computer-mouse', 'fa-solid fa-print', 'fa-solid fa-network-wired', 'fa-solid fa-wifi',
  'fa-solid fa-mobile-screen', 'fa-solid fa-tablet-screen-button', 'fa-solid fa-camera', 'fa-solid fa-tv',
  'fa-solid fa-plug', 'fa-solid fa-battery-full', 'fa-solid fa-screwdriver-wrench', 'fa-solid fa-box-open',
] as const

export const DEFAULT_CATEGORY_ICON = 'fa-solid fa-folder'

const sameName = (a: string, b: string) => foldText(a) === foldText(b)

/* ---------- Uso (para conteos y para bloquear eliminaciones) ---------- */

export const productsInCategory = (products: Product[], categoryId: string) => products.filter((p) => p.category === categoryId)

export const productsOfBrand = (products: Product[], brandName: string) => products.filter((p) => sameName(p.brand, brandName))

/* ---------- Validación ---------- */

export function validateCategory(v: { id?: string; name: string; description: string }, categories: Category[]): Record<string, string> {
  const e: Record<string, string> = {}
  const name = v.name.trim()
  if (name.length < 3) e.name = 'Ingresa un nombre de al menos 3 caracteres.'
  else if (name.length > 40) e.name = 'Máximo 40 caracteres.'
  else if (!slugify(name)) e.name = 'Usa al menos una letra o número.'
  else if (categories.some((c) => c.id !== v.id && sameName(c.name, name))) e.name = 'Ya existe una categoría con ese nombre.'
  if (v.description.trim().length > 160) e.description = 'Máximo 160 caracteres.'
  return e
}

const URL_PATTERN = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i

export function validateBrand(v: { id?: string; name: string; website: string; description: string }, brands: Brand[]): Record<string, string> {
  const e: Record<string, string> = {}
  const name = v.name.trim()
  if (name.length < 2) e.name = 'Ingresa el nombre de la marca.'
  else if (name.length > 40) e.name = 'Máximo 40 caracteres.'
  else if (brands.some((b) => b.id !== v.id && sameName(b.name, name))) e.name = 'Esta marca ya está registrada.'
  if (v.website.trim() && !URL_PATTERN.test(v.website.trim())) e.website = 'URL no válida (ej. https://www.hp.com).'
  if (v.description.trim().length > 160) e.description = 'Máximo 160 caracteres.'
  return e
}

/* ---------- Reglas de eliminación ---------- */

/** Una categoría con productos no se elimina: primero hay que reasignarlos. */
export const categoryDeleteBlock = (productCount: number): string | null =>
  productCount > 0 ? `Tiene ${productCount} producto(s). Reasígnalos a otra categoría antes de eliminarla.` : null

/** Una marca con productos no se elimina (se perdería el dato): se puede desactivar. */
export const brandDeleteBlock = (productCount: number): string | null =>
  productCount > 0 ? `Tiene ${productCount} producto(s). Desactívala para dejar de ofrecerla en productos nuevos.` : null

/* ---------- Identificadores ---------- */

/** Slug único: si ya existe, agrega sufijo numérico (-2, -3…). */
export function uniqueSlug(name: string, taken: string[], fallback: string): string {
  const base = slugify(name) || fallback
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/**
 * Marcas iniciales a partir de los productos (el catálogo anterior guardaba la marca
 * como texto libre). Agrupa variantes de escritura ("hp" / "HP").
 */
export function deriveBrands(products: Product[], createdAt = new Date().toISOString()): Brand[] {
  const brands: Brand[] = []
  for (const p of products) {
    const name = p.brand.trim()
    if (!name || brands.some((b) => sameName(b.name, name))) continue
    const slug = uniqueSlug(name, brands.map((b) => b.slug), 'marca')
    brands.push({ id: slug, name, slug, website: '', description: '', active: true, createdAt })
  }
  return brands.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Búsqueda sin acentos por los campos de texto indicados. */
export const matchesText = (fields: string[], search: string): boolean => {
  const term = foldText(search)
  return !term || fields.some((f) => foldText(f).includes(term))
}

/**
 * Opciones de marca del formulario de producto: solo marcas activas; si el producto
 * ya tiene una marca inactiva o no registrada, se conserva marcada para no perderla.
 */
export function brandOptions(brands: Brand[], current: string) {
  const options = brands
    .filter((b) => b.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((b) => ({ value: b.name, label: b.name }))
  const value = current.trim()
  if (value && !options.some((o) => sameName(o.value, value))) {
    const known = brands.some((b) => sameName(b.name, value))
    options.push({ value, label: `${value} (${known ? 'inactiva' : 'no registrada'})` })
  }
  return [{ value: '', label: 'Selecciona una marca…' }, ...options]
}
