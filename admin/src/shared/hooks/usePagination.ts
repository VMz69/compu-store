import { useMemo, useState, type ChangeEvent } from 'react'
import { clampPage, getPageCount, getPageRange, type PageToken } from '@/shared/lib/pagination'

export interface UsePaginationOptions {
  /** Tamaños ofrecidos en el selector "Por página" (ej. [8, 12, 24]). */
  pageSizeOptions: number[]
  /** Tamaño inicial. Por defecto, la primera opción. */
  initialPageSize?: number
  /**
   * Clave que, al cambiar, devuelve la paginación a la página 1.
   * Úsala con los filtros activos (búsqueda, categoría, estado…) para que el
   * usuario no quede en la página 4 de un resultado que ahora tiene 1 página.
   */
  resetKey?: string
}

/** Estado y acciones que consume el componente `<Pagination />`. */
export interface PaginationState {
  /** Página actual (1-based), siempre dentro del rango válido. */
  page: number
  pageCount: number
  pageSize: number
  pageSizeOptions: number[]
  totalItems: number
  /** Posición (1-based) del primer y último ítem visible; 0 si no hay ítems. */
  rangeStart: number
  rangeEnd: number
  /** Botones a dibujar (números y elipsis). Ver `getPageRange`. */
  pages: PageToken[]
  canPrev: boolean
  canNext: boolean
  goTo: (page: number) => void
  prev: () => void
  next: () => void
  onPageSizeChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

/**
 * Paginación del lado del cliente para cualquier lista ya filtrada.
 *
 * Devuelve el subconjunto visible (`pageItems`) y el estado del paginador
 * (`pagination`) listo para pasarlo a `<Pagination pagination={...} />`.
 *
 * Decisiones de diseño:
 * - **Sin `useEffect`**: el reinicio por `resetKey` se resuelve derivando la
 *   página en render (se guarda la clave con la que se eligió la página; si la
 *   clave actual difiere, la página efectiva es 1). Evita renders dobles y
 *   cumple la regla `react-hooks/set-state-in-effect`.
 * - **Página siempre válida**: si se eliminan ítems y la página actual deja de
 *   existir, se ajusta automáticamente a la última (`clampPage`).
 * - Cambiar el tamaño de página vuelve a la página 1.
 *
 * @example
 * const filtered = useFilteredOrders()
 * const { pageItems, pagination } = usePagination(filtered, {
 *   pageSizeOptions: [5, 10, 25],
 *   resetKey: statusFilter,
 * })
 * // <OrdersTable orders={pageItems} />  <Pagination pagination={pagination} idPrefix="sales" />
 */
export function usePagination<T>(items: T[], options: UsePaginationOptions) {
  const { pageSizeOptions, initialPageSize = pageSizeOptions[0], resetKey = '' } = options

  // `key` registra el resetKey vigente cuando se eligió la página.
  const [state, setState] = useState({ page: 1, pageSize: initialPageSize, key: resetKey })

  const totalItems = items.length
  const pageCount = getPageCount(totalItems, state.pageSize)
  const requestedPage = state.key === resetKey ? state.page : 1
  const page = clampPage(requestedPage, pageCount)
  const start = (page - 1) * state.pageSize

  const pageItems = useMemo(
    () => items.slice(start, start + state.pageSize),
    [items, start, state.pageSize],
  )

  const goTo = (target: number) =>
    setState((s) => ({ ...s, page: clampPage(target, pageCount), key: resetKey }))

  const pagination: PaginationState = {
    page,
    pageCount,
    pageSize: state.pageSize,
    pageSizeOptions,
    totalItems,
    rangeStart: totalItems === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + state.pageSize, totalItems),
    pages: getPageRange(page, pageCount),
    canPrev: page > 1,
    canNext: page < pageCount,
    goTo,
    prev: () => goTo(page - 1),
    next: () => goTo(page + 1),
    onPageSizeChange: (event) =>
      setState({ page: 1, pageSize: Number(event.target.value), key: resetKey }),
  }

  return { pageItems, pagination }
}
