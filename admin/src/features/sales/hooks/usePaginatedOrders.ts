import { usePagination } from '@/shared/hooks/usePagination'
import { useOrderFiltersStore } from '../filters.store'
import { useFilteredOrders } from './useOrders'

/** Tamaños de página de la tabla de pedidos. */
export const ORDER_PAGE_SIZES = [5, 10, 25, 50]

/**
 * Pedidos filtrados por pestaña de estado + paginados.
 * Cambiar de pestaña regresa a la página 1 (vía `resetKey`).
 */
export function usePaginatedOrders() {
  const filtered = useFilteredOrders()
  const statusFilter = useOrderFiltersStore((s) => s.statusFilter)

  const { pageItems, pagination } = usePagination(filtered, {
    pageSizeOptions: ORDER_PAGE_SIZES,
    resetKey: statusFilter,
  })

  return { orders: pageItems, totalCount: filtered.length, pagination }
}
