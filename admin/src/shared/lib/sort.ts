/** Orden de tablas: dirección y estado genérico (clave de columna + dirección). */
export type SortDir = 'asc' | 'desc'

export interface SortState<K extends string = string> {
  key: K
  dir: SortDir
}

/**
 * Siguiente estado al pulsar un encabezado: la misma columna invierte la dirección;
 * una columna nueva empieza en su dirección natural (ej. fechas y montos: desc).
 */
export function nextSort<K extends string>(current: SortState<K>, key: K, firstDir: SortDir = 'asc'): SortState<K> {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: firstDir }
}

/** Ordena una copia con un comparador ascendente; `desc` lo invierte. Estable ante empates. */
export function sortWith<T>(items: T[], compare: (a: T, b: T) => number, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => sign * compare(a.item, b.item) || a.index - b.index)
    .map((x) => x.item)
}
