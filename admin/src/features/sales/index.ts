// API pública del feature `sales`. Desde fuera solo se importa este archivo.
export { ChannelFormModal } from './components/channels/ChannelFormModal'
export { ChannelsSection } from './components/channels/ChannelsSection'
export { OrderDetailModal } from './components/detail/OrderDetailModal'
export { OrderFormModal } from './components/form/OrderFormModal'
export { RecentOrdersTable } from './components/orders/RecentOrdersTable'
export { PipelineSection } from './components/pipeline/PipelineSection'
export { StatusDetailModal } from './components/pipeline/StatusDetailModal'
export { useChannels } from './hooks/useChannels'
export { useOrderActions } from './hooks/useOrderActions'
export {
  useOrderMetrics,
  useInvoiceableCount,
  usePendingOrdersCount,
  useRecentOrders,
  useShowOrdersByStatus,
} from './hooks/useOrders'
export { SALES_MODALS } from './modals'
export { OrdersPage } from './pages/OrdersPage'
export { INVOICE_VOIDED_STATUS, INVOICED_STATUS, isInvoiceable } from './lib/order.service'
export { getSalesSnapshot, resetSales, setOrderInvoice, useSalesStore } from './store'
export type { Channel, Order, OrderMetrics, OrderStatus } from './types'
