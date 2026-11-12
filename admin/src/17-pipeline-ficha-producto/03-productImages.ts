import { uid } from '@/85-pipeline-identificadores-texto/02-uid'

/**
 * Reglas de negocio de la galería de imágenes del producto.
 *
 * - La galería es una lista ordenada: la primera imagen es la PORTADA que se
 *   muestra en tarjetas, tablas, cotizaciones y Front Office (`imageUrl`).
 * - No se permiten imágenes repetidas ni más de `MAX_PRODUCT_IMAGES`.
 * - En modo demo los archivos locales se guardan como data URL en localStorage
 *   (~5 MB por origen), por eso hay límite por archivo y presupuesto por producto.
 *   Con API real se subiría el archivo y se guardaría solo su URL.
 */

export const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/f8fafc/0168f5?text=CompuStore+SV'

export const MAX_PRODUCT_IMAGES = 8
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024
export const MAX_LOCAL_GALLERY_BYTES = 3 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Fila editable de la galería (el `id` solo sirve como key de React). */
export interface ImageRow {
  id: string
  src: string
}

export const toImageRows = (sources: string[]): ImageRow[] => sources.map((src) => ({ id: uid(), src }))

export const isDataUrl = (src: string): boolean => src.startsWith('data:')

/** Peso aproximado en bytes de un data URL (base64 ≈ 4/3 del binario). */
const dataUrlBytes = (src: string): number => (isDataUrl(src) ? Math.ceil((src.length * 3) / 4) : 0)

export const localGalleryBytes = (sources: string[]): number =>
  sources.reduce((acc, src) => acc + dataUrlBytes(src), 0)

export const formatMegabytes = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/** Solo se aceptan URLs absolutas http(s). */
export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export interface AppendResult {
  rows: ImageRow[]
  added: number
  duplicates: number
  /** Descartadas por superar el máximo de imágenes. */
  overflow: number
  /** Descartadas por superar el presupuesto de almacenamiento local. */
  overBudget: number
}

/** Agrega imágenes al final respetando duplicados, capacidad y presupuesto local. */
export function appendImages(rows: ImageRow[], sources: string[]): AppendResult {
  const result: AppendResult = { rows: [...rows], added: 0, duplicates: 0, overflow: 0, overBudget: 0 }
  let budget = MAX_LOCAL_GALLERY_BYTES - localGalleryBytes(rows.map((r) => r.src))

  for (const raw of sources) {
    const src = raw.trim()
    if (!src) continue
    if (result.rows.some((r) => r.src === src)) {
      result.duplicates += 1
    } else if (result.rows.length >= MAX_PRODUCT_IMAGES) {
      result.overflow += 1
    } else if (dataUrlBytes(src) > budget) {
      result.overBudget += 1
    } else {
      budget -= dataUrlBytes(src)
      result.rows.push({ id: uid(), src })
      result.added += 1
    }
  }
  return result
}

export const removeImage = (rows: ImageRow[], id: string): ImageRow[] => rows.filter((r) => r.id !== id)

/** Desplaza una imagen `offset` posiciones (−1 izquierda, +1 derecha). */
export function moveImage(rows: ImageRow[], id: string, offset: number): ImageRow[] {
  const from = rows.findIndex((r) => r.id === id)
  const to = from + offset
  if (from < 0 || to < 0 || to >= rows.length) return rows
  const next = [...rows]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  return next
}

/** Convierte una imagen en portada (la mueve al inicio). */
export function makeCover(rows: ImageRow[], id: string): ImageRow[] {
  const row = rows.find((r) => r.id === id)
  return row ? [row, ...rows.filter((r) => r.id !== id)] : rows
}

/**
 * Galería efectiva de un producto. `images` es la fuente de verdad; los datos
 * del modelo anterior solo tenían `imageUrl` y se migran como galería de 1.
 * El placeholder nunca cuenta como imagen real.
 */
export function resolveGallery(raw: { images?: unknown; imageUrl?: string }): string[] {
  const list = Array.isArray(raw.images) ? raw.images : raw.imageUrl ? [raw.imageUrl] : []
  return list.filter((src): src is string => typeof src === 'string' && src.trim() !== '' && src !== PLACEHOLDER_IMAGE)
}

/** Imágenes a mostrar en visores: la galería o, si está vacía, el placeholder. */
export const displayImages = (images: string[]): string[] => (images.length ? images : [PLACEHOLDER_IMAGE])
