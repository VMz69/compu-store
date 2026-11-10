// API pública del feature `sales` (/pedidos). Desde fuera solo se importa este archivo.
import { provideCustomerStats } from '@/features/customers'
import { useCustomerOrderStats } from './hooks/useOrders'

// Implementa el puerto de métricas de Clientes (Clientes no importa Pedidos).
provideCustomerStats(useCustomerOrderStats)

export { ChannelFormModal } from './components/channels/ChannelFormModal'
export { ChannelsSection } from './components/channels/ChannelsSection'
export { OrderDetailModal } from './components/detail/OrderDetailModal'
export { OrderStatusBadge } from './components/OrderStatusBadge'
export { RecentOrdersTable } from './components/orders/RecentOrdersTable'
export { PipelineSection } from './components/pipeline/PipelineSection'
export { StatusDetailModal } from './components/pipeline/StatusDetailModal'
export { useChannels } from './hooks/useChannels'
export { useOrderActions } from './hooks/useOrderActions'
export {
  orderStatusName,
  useInvoiceableCount,
  useOrderMetrics,
  usePendingOrdersCount,
  useQuoteOrderLink,
  useRecentOrders,
  useReservedStock,
  useShowOrdersByStatus,
} from './hooks/useOrders'
export { isInvoiceable, ORDER_STATUSES } from './lib/orderFlow'
export { SALES_MODALS } from './modals'
export { NewOrderPage } from './pages/NewOrderPage'
export { OrdersPage } from './pages/OrdersPage'
export { startOrderFromQuote } from './prefill.store'
export { findOrder, getSalesSnapshot, resetSales, setOrderInvoice, useSalesStore } from './store'
export type { Channel, Order, OrderItem, OrderMetrics, OrderPrefill, OrderStatus, OrderStatusId } from './types'
