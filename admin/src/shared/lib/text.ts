/** Texto plegado para búsquedas: minúsculas y sin acentos ("María" → "maria"). */
export const foldText = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Slug en minúsculas sin acentos ni símbolos (ej. "Redes & Conectividad" → "redes-conectividad"). */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Siguiente id secuencial con prefijo (ej. PRD-012 → PRD-013), robusto ante eliminaciones. */
export const nextSequentialId = (ids: string[], prefix: string, pad = 3): string => {
  const max = ids.reduce((acc, id) => {
    const n = parseInt(id.replace(prefix, ''), 10)
    return Number.isNaN(n) ? acc : Math.max(acc, n)
  }, 0)
  return `${prefix}${String(max + 1).padStart(pad, '0')}`
}

/** Porcentaje entero seguro ante divisores en cero. */
export const percent = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0

/**
 * Búsqueda por varios parámetros a la vez: cada palabra de la consulta debe aparecer
 * en ALGÚN campo (AND entre palabras, OR entre campos). Sin acentos ni mayúsculas;
 * las palabras numéricas también comparan solo dígitos ("74889922" ↔ "7488-9922").
 *
 * @example matchesQuery(['ORD-2026-002', 'Carlos Henríquez', 'Efectivo'], 'carlos efectivo') // true
 */
export function matchesQuery(fields: Array<string | number | null | undefined>, query: string): boolean {
  const terms = foldText(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = fields.filter((f) => f !== null && f !== undefined && f !== '').map((f) => foldText(String(f)))
  const digits = haystack.map((f) => f.replace(/\D/g, ''))
  return terms.every((term) => {
    const termDigits = /^[\d\s+-]+$/.test(term) ? term.replace(/\D/g, '') : ''
    return haystack.some((f) => f.includes(term)) || (termDigits.length >= 3 && digits.some((d) => d.includes(termDigits)))
  })
}
