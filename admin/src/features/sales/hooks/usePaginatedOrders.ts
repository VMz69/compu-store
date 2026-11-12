import { useDeferredValue, useMemo, type ChangeEvent } from 'react'
import { matchesQuery } from '@/85-pipeline-identificadores-texto/00-director-identificadores-texto'
import { usePagination } from '@/70-pipeline-orden-paginacion/04-usePagination'
import { useOrderFiltersStore } from '../filters.store'
import { orderSearchFields } from '../lib/order.service'
import { statusOf } from '../lib/orderFlow'
import { sortOrders, type OrderSortKey } from '../lib/orderSort'
import { useFilteredOrders } from './useOrders'

/** Tamaños de página de la tabla de pedidos. */
export const ORDER_PAGE_SIZES = [5, 10, 25, 50]

/**
 * Pedidos filtrados por pestaña de estado y búsqueda en tiempo real, ordenados por columna y paginados.
 * El orden se aplica a TODOS los pedidos filtrados antes de paginar (no solo a la
 * página visible). Cambiar de pestaña u orden regresa a la página 1 (vía `resetKey`).
 */
export function usePaginatedOrders() {
  const filtered = useFilteredOrders()
  const statusFilter = useOrderFiltersStore((s) => s.statusFilter)
  const sort = useOrderFiltersStore((s) => s.sort)
  const toggleSort = useOrderFiltersStore((s) => s.toggleSort)
  const search = useOrderFiltersStore((s) => s.search)
  const setSearch = useOrderFiltersStore((s) => s.setSearch)
  // Valor diferido: escribir no se bloquea mientras se filtra la lista.
  const query = useDeferredValue(search)
  const matched = useMemo(
    () => (query.trim() ? filtered.filter((o) => matchesQuery(orderSearchFields(o, statusOf(o.status).name), query)) : filtered),
    [filtered, query],
  )
  const sorted = useMemo(() => sortOrders(matched, sort), [matched, sort])

  const { pageItems, pagination } = usePagination(sorted, {
    pageSizeOptions: ORDER_PAGE_SIZES,
    resetKey: `${statusFilter}|${sort.key}|${sort.dir}|${query}`,
  })

  return {
    orders: pageItems,
    totalCount: matched.length,
    search: {
      value: search,
      onChange: (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
      clear: () => setSearch(''),
      /** Hay texto de búsqueda (para distinguir "sin resultados" de "sin pedidos"). */
      active: search.trim().length > 0,
    },
    pagination,
    sort,
    onSort: (key: string) => toggleSort(key as OrderSortKey),
  }
}

export type PaginatedOrdersApi = ReturnType<typeof usePaginatedOrders>
