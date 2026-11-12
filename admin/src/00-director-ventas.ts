// API pública del feature `sales` (/pedidos). Desde fuera solo se importa este archivo.
import { provideReservedStock } from '@/00-director-catalogo'
import { provideCustomerStats } from '@/00-director-clientes'
import { useCustomerOrderStats, useReservedStock } from './features/sales/hooks/useOrders'

// Implementa el puerto de métricas de Clientes (Clientes no importa Pedidos).
provideCustomerStats(useCustomerOrderStats)
// Implementa el puerto de stock reservado de Catálogo (Productos muestra lo apartado).
provideReservedStock(() => useReservedStock())

export { ChannelFormModal } from './features/sales/components/channels/ChannelFormModal'
export { ChannelsTable } from './features/sales/components/channels/ChannelsTable'
export { FlowTable } from './features/sales/components/flow/FlowTable'
export { StatusLabelModal } from './features/sales/components/flow/StatusLabelModal'
export { OrderDetailModal } from './features/sales/components/detail/OrderDetailModal'
export { ReserveOrderModal } from './features/sales/components/reserve/ReserveOrderModal'
export { OrderStatusBadge } from './features/sales/components/OrderStatusBadge'
export { ReservationTag } from './features/sales/components/ReservationTag'
export { RecentOrdersTable } from './features/sales/components/orders/RecentOrdersTable'
export { useChannels } from './features/sales/hooks/useChannels'
export { useFlowTable } from './features/sales/hooks/useFlowTable'
export { useOrderActions } from './features/sales/hooks/useOrderActions'
export { useReservationExpiry } from './features/sales/hooks/useReservationExpiry'
export {
  orderStatusName,
  useInvoiceableCount,
  useOrderMetrics,
  usePendingOrdersCount,
  useQuoteOrderLink,
  useRecentOrders,
  useReservedStock,
} from './features/sales/hooks/useOrders'
export { isInvoiceable, ORDER_STATUSES } from './features/sales/lib/orderFlow'
export { orderSearchFields } from './features/sales/lib/order.service'
export { SALES_MODALS } from './features/sales/modals'
export { EditOrderPage } from './features/sales/pages/EditOrderPage'
export { NewOrderPage } from './features/sales/pages/NewOrderPage'
export { OrdersPage } from './features/sales/pages/OrdersPage'
export { startOrderFromQuote } from './features/sales/prefill.store'
export { findOrder, getSalesSnapshot, resetSales, setOrderInvoice, useSalesStore } from './features/sales/store'
export type { Channel, Order, OrderCharge, OrderItem, OrderMetrics, OrderPrefill, OrderStatus, OrderStatusId } from './features/sales/types'
