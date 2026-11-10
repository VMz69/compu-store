import { useMemo } from 'react'
import { usePagination } from '@/shared/hooks/usePagination'
import { useOrderFiltersStore } from '../filters.store'
import { sortOrders, type OrderSortKey } from '../lib/orderSort'
import { useFilteredOrders } from './useOrders'

/** Tamaños de página de la tabla de pedidos. */
export const ORDER_PAGE_SIZES = [5, 10, 25, 50]

/**
 * Pedidos filtrados por pestaña de estado, ordenados por columna y paginados.
 * El orden se aplica a TODOS los pedidos filtrados antes de paginar (no solo a la
 * página visible). Cambiar de pestaña u orden regresa a la página 1 (vía `resetKey`).
 */
export function usePaginatedOrders() {
  const filtered = useFilteredOrders()
  const statusFilter = useOrderFiltersStore((s) => s.statusFilter)
  const sort = useOrderFiltersStore((s) => s.sort)
  const toggleSort = useOrderFiltersStore((s) => s.toggleSort)
  const sorted = useMemo(() => sortOrders(filtered, sort), [filtered, sort])

  const { pageItems, pagination } = usePagination(sorted, {
    pageSizeOptions: ORDER_PAGE_SIZES,
    resetKey: `${statusFilter}|${sort.key}|${sort.dir}`,
  })

  return {
    orders: pageItems,
    totalCount: filtered.length,
    pagination,
    sort,
    onSort: (key: string) => toggleSort(key as OrderSortKey),
  }
}
