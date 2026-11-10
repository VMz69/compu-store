import { useCallback, useMemo } from 'react'
import type { Customer } from '@/features/customers'
import { getCustomerOrderStats } from '../lib/customerStats'
import { countByStatus, filterByStatus, findOrderByQuote, getOrderMetrics } from '../lib/order.service'
import { isInvoiceable, ORDER_STATUSES, statusOf } from '../lib/orderFlow'
import { reservedByProduct } from '../lib/stock'
import { useOrderFiltersStore, type OrderStatusFilter } from '../filters.store'
import { useSalesStore } from '../store'
import type { OrderStatusId } from '../types'

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

/** Implementación del puerto de métricas de Clientes (registrada en `index.ts`). */
export function useCustomerOrderStats() {
  const orders = useSalesStore((s) => s.orders)
  return useCallback((customer: Customer) => getCustomerOrderStats(customer, orders), [orders])
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
