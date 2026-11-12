/**
 * Paginación del lado del cliente — utilidades puras (sin React).
 *
 * Arquitectura (3 capas, de abajo hacia arriba):
 *  1. `shared/lib/pagination.ts`   → este archivo: cálculos puros y testeables.
 *  2. `shared/hooks/usePagination` → estado (página, tamaño) + corte del arreglo.
 *  3. `shared/ui/Pagination.tsx`   → vista Tailwind sin lógica (regla DOMA).
 *
 * Convención: las páginas son **1-based** (la primera página es 1), igual que
 * lo que ve el usuario, para no traducir índices entre capas.
 *
 * Cuando exista API real, el mismo contrato sirve para paginación en servidor:
 * se reemplaza el `slice` del hook por `?page=&pageSize=` y `totalItems` pasa
 * a venir en la respuesta; la UI no cambia.
 */

/** Elemento del paginador: número de página o un salto ("…"). */
export type PageToken = number | 'ellipsis-start' | 'ellipsis-end'

/** Total de páginas. Nunca devuelve 0: una lista vacía tiene 1 página (vacía). */
export const getPageCount = (totalItems: number, pageSize: number): number =>
  Math.max(1, Math.ceil(totalItems / pageSize))

/** Ajusta `page` al rango válido [1, pageCount]. */
export const clampPage = (page: number, pageCount: number): number =>
  Math.min(Math.max(1, page), pageCount)

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

/**
 * Secuencia de botones a mostrar, con elipsis cuando hay muchas páginas.
 * Siempre incluye la primera y la última; alrededor de la actual muestra
 * `siblings` páginas por lado. El número de tokens es constante para que el
 * paginador no "salte" de ancho al navegar.
 *
 * @example
 * getPageRange(1, 10)  // [1, 2, 3, 4, 5, 'ellipsis-end', 10]
 * getPageRange(5, 10)  // [1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]
 * getPageRange(10, 10) // [1, 'ellipsis-start', 6, 7, 8, 9, 10]
 * getPageRange(2, 4)   // [1, 2, 3, 4]  (caben todas, sin elipsis)
 */
export function getPageRange(current: number, pageCount: number, siblings = 1): PageToken[] {
  // primera + última + actual + 2 elipsis + hermanos a cada lado
  const totalSlots = siblings * 2 + 5
  if (pageCount <= totalSlots) return range(1, pageCount)

  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, pageCount)
  const showStartDots = left > 2
  const showEndDots = right < pageCount - 1
  const edgeCount = 3 + siblings * 2 // bloque contiguo cuando solo hay una elipsis

  if (!showStartDots && showEndDots) return [...range(1, edgeCount), 'ellipsis-end', pageCount]
  if (showStartDots && !showEndDots) {
    return [1, 'ellipsis-start', ...range(pageCount - edgeCount + 1, pageCount)]
  }
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', pageCount]
}
