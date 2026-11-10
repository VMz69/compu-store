// API pública del feature `sales` (/pedidos). Desde fuera solo se importa este archivo.
import { provideCustomerStats } from '@/features/customers'
import { useCustomerOrderStats } from './hooks/useOrders'

// Implementa el puerto de métricas de Clientes (Clientes no importa Pedidos).
provideCustomerStats(useCustomerOrderStats)

export { ChannelFormModal } from './components/channels/ChannelFormModal'
export { ChannelsTable } from './components/channels/ChannelsTable'
export { FlowTable } from './components/flow/FlowTable'
export { StatusLabelModal } from './components/flow/StatusLabelModal'
export { OrderDetailModal } from './components/detail/OrderDetailModal'
export { OrderStatusBadge } from './components/OrderStatusBadge'
export { RecentOrdersTable } from './components/orders/RecentOrdersTable'
export { useChannels } from './hooks/useChannels'
export { useFlowTable } from './hooks/useFlowTable'
export { useOrderActions } from './hooks/useOrderActions'
export {
  orderStatusName,
  useInvoiceableCount,
  useOrderMetrics,
  usePendingOrdersCount,
  useQuoteOrderLink,
  useRecentOrders,
  useReservedStock,
} from './hooks/useOrders'
export { isInvoiceable, ORDER_STATUSES } from './lib/orderFlow'
export { SALES_MODALS } from './modals'
export { EditOrderPage } from './pages/EditOrderPage'
export { NewOrderPage } from './pages/NewOrderPage'
export { OrdersPage } from './pages/OrdersPage'
export { startOrderFromQuote } from './prefill.store'
export { findOrder, getSalesSnapshot, resetSales, setOrderInvoice, useSalesStore } from './store'
export type { Channel, Order, OrderCharge, OrderItem, OrderMetrics, OrderPrefill, OrderStatus, OrderStatusId } from './types'
