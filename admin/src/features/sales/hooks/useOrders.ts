import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { countByStatus, filterByStatus, getOrderMetrics, FALLBACK_STATUS_STYLE, isInvoiceable } from '../lib/order.service'
import { useOrderFiltersStore } from '../filters.store'
import { useSalesStore } from '../store'

/** Pedidos visibles según la pestaña de estado activa. */
export function useFilteredOrders() {
  const orders = useSalesStore((s) => s.orders)
  const statusFilter = useOrderFiltersStore((s) => s.statusFilter)
  return useMemo(() => filterByStatus(orders, statusFilter), [orders, statusFilter])
}

export function useOrderMetrics() {
  const orders = useSalesStore((s) => s.orders)
  return useMemo(() => getOrderMetrics(orders), [orders])
}

export function useRecentOrders(limit = 4) {
  const orders = useSalesStore((s) => s.orders)
  return useMemo(() => orders.slice(0, limit), [orders, limit])
}

/** Pedidos en estado "Pendiente" (badge del sidebar). */
export function usePendingOrdersCount(): number {
  const orders = useSalesStore((s) => s.orders)
  return countByStatus(orders, 'Pendiente')
}

/** Pedidos listos para facturar (badge "Facturación" del sidebar). */
export function useInvoiceableCount(): number {
  const orders = useSalesStore((s) => s.orders)
  return orders.filter(isInvoiceable).length
}

/** Ícono y estilo del badge para un estado (por nombre o id). */
export function useStatusStyle(status: string) {
  const found = useSalesStore((s) => s.statuses.find((x) => x.name === status || x.id === status))
  return found ? { icon: found.icon, badgeStyle: found.badgeStyle } : FALLBACK_STATUS_STYLE
}

/** Pestañas de estado con conteo para la vista Pedidos. */
export function useOrderStatusTabs() {
  const orders = useSalesStore((s) => s.orders)
  const statuses = useSalesStore((s) => s.statuses)
  const active = useOrderFiltersStore((s) => s.statusFilter)
  const select = useOrderFiltersStore((s) => s.setStatusFilter)

  const tabs = useMemo(
    () => [
      { value: 'all', label: `Todos (${orders.length})`, icon: null },
      ...statuses.map((s) => ({
        value: s.name,
        label: `${s.name} (${countByStatus(orders, s.name)})`,
        icon: `fa-solid ${s.icon}`,
      })),
    ],
    [orders, statuses],
  )

  return { tabs, active, select }
}

/** Pre-filtra Pedidos por estado y navega a la vista (usado desde Ajustes). */
export function useShowOrdersByStatus() {
  const navigate = useNavigate()
  const setStatusFilter = useOrderFiltersStore((s) => s.setStatusFilter)

  return (status: string) => {
    setStatusFilter(status)
    navigate('/pedidos')
  }
}
