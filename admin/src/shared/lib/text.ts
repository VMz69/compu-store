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
