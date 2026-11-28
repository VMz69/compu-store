import { useCallback, useEffect, useMemo } from 'react'
import type { Customer, CustomerStats } from '@/00-director-clientes'
import { countByStatus, filterByStatus, findOrderByQuote } from '../42-pipeline-persistencia-pedidos/02-order.service'
import { isInvoiceable, ORDER_STATUSES, statusOf } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import { reservedByProduct } from '../39-pipeline-transiciones-pedidos/03-stock'
import { useOrderFiltersStore, type OrderStatusFilter } from './02-filters.store'
import { refreshCustomerStats, refreshOrderMetrics, useSalesStore } from '../42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos'
import type { OrderMetrics, OrderStatusId } from '../42-pipeline-persistencia-pedidos/05-types'

const NO_METRICS: OrderMetrics = { total: 0, registered: 0, confirmed: 0, invoiced: 0, delivered: 0, cancelled: 0, active: 0, revenue: 0 }
const NO_STATS: CustomerStats = { orderCount: 0, totalSpent: 0, lastOrderDate: null }

/** Pedidos visibles según la pestaña de estado activa. */
export function useFilteredOrders() {
  const orders = useSalesStore((s) => s.orders)
  const statusFilter = useOrderFiltersStore((s) => s.statusFilter)
  return useMemo(() => filterByStatus(orders, statusFilter), [orders, statusFilter])
}

/** Métricas del tablero calculadas en el servidor (L18); se releen al abrir el Tablero. */
export function useOrderMetrics(): OrderMetrics {
  useEffect(() => {
    void refreshOrderMetrics()
  }, [])
  return useSalesStore((s) => s.orderMetrics) ?? NO_METRICS
}

export function useRecentOrders(limit = 4) {
  const orders = useSalesStore((s) => s.orders)
  return useMemo(() => orders.slice(0, limit), [orders, limit])
}

/** Pedidos "Registrados" pendientes de confirmar (badge del sidebar). */
export function usePendingOrdersCount(): number {
  const orders = useSalesStore((s) => s.orders)
  return countByStatus(orders, 'registrado')
}

/** Pedidos listos para facturar (badge "Facturación" del sidebar). */
export function useInvoiceableCount(): number {
  const orders = useSalesStore((s) => s.orders)
  return orders.filter(isInvoiceable).length
}

/**
 * Unidades reservadas por producto (pedidos "Reservado" vigentes). Al editar un
 * pedido confirmado se excluye su propia reserva: sus unidades siguen disponibles para él.
 */
export function useReservedStock(excludeOrderId?: string): Record<string, number> {
  const orders = useSalesStore((s) => s.orders)
  return useMemo(() => reservedByProduct(orders, excludeOrderId), [orders, excludeOrderId])
}

/**
 * Implementación del puerto de métricas de Clientes (registrada en `00-director-ventas`). Desde L18 el
 * historial lo calcula el servidor (por cliente o, sin él, por teléfono) y se relee al abrir Clientes.
 */
export function useCustomerOrderStats() {
  useEffect(() => {
    void refreshCustomerStats()
  }, [])
  const stats = useSalesStore((s) => s.customerStats)
  return useCallback((customer: Customer) => stats[customer.id] ?? NO_STATS, [stats])
}

/** Pedido activo generado desde cada cotización (para el estado "Convertida"). */
export function useQuoteOrderLink() {
  const orders = useSalesStore((s) => s.orders)
  return useCallback((quoteId: string) => findOrderByQuote(orders, quoteId)?.id ?? null, [orders])
}

/** Pestañas de estado con conteo para la vista Pedidos. */
export function useOrderStatusTabs() {
  const orders = useSalesStore((s) => s.orders)
  const active = useOrderFiltersStore((s) => s.statusFilter)
  const select = useOrderFiltersStore((s) => s.setStatusFilter)

  const tabs = useMemo(
    () => [
      { id: 'all' as OrderStatusFilter, label: 'Todos', count: orders.length },
      ...ORDER_STATUSES.map((s) => ({
        id: s.id as OrderStatusFilter,
        label: statusOf(s.id).name,
        count: countByStatus(orders, s.id),
        icon: `fa-solid ${s.icon}`,
      })),
    ],
    [orders],
  )

  /** Área activa para la línea de ubicación de la barra (Pedidos › Reservado). */
  const activeLabel = tabs.find((tab) => tab.id === active)?.label ?? 'Todos'

  return { tabs, active, select, activeLabel }
}

/** Estado con sus textos personalizados; re-renderiza cuando se editan en Ajustes. */
export function useStatusMeta(status: OrderStatusId) {
  useSalesStore((s) => s.statusLabels[status])
  return statusOf(status)
}

export const orderStatusName = (status: OrderStatusId): string => statusOf(status).name
