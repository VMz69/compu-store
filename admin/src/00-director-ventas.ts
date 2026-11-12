// API pública del feature `sales` (/pedidos). Desde fuera solo se importa este archivo.
import { provideReservedStock } from '@/00-director-catalogo'
import { provideCustomerStats } from '@/00-director-clientes'
import { useCustomerOrderStats, useReservedStock } from './35-pipeline-consulta-pedidos/00-director-consulta-pedidos'

// Implementa el puerto de métricas de Clientes (Clientes no importa Pedidos).
provideCustomerStats(useCustomerOrderStats)
// Implementa el puerto de stock reservado de Catálogo (Productos muestra lo apartado).
provideReservedStock(() => useReservedStock())

export { ChannelFormModal } from './40-pipeline-canales-venta/02-ChannelFormModal'
export { ChannelsTable } from './40-pipeline-canales-venta/00-director-canales-venta'
export { FlowTable } from './41-pipeline-etapas-venta/00-director-etapas-venta'
export { StatusLabelModal } from './41-pipeline-etapas-venta/02-StatusLabelModal'
export { OrderDetailModal } from './37-pipeline-detalle-pedidos/00-director-detalle-pedidos'
export { ReserveOrderModal } from './38-pipeline-reserva-pedidos/00-director-reserva-pedidos'
export { OrderStatusBadge } from './39-pipeline-transiciones-pedidos/04-OrderStatusBadge'
export { ReservationTag } from './38-pipeline-reserva-pedidos/05-ReservationTag'
export { RecentOrdersTable } from './35-pipeline-consulta-pedidos/05-RecentOrdersTable'
export { useChannels } from './40-pipeline-canales-venta/03-useChannels'
export { useFlowTable } from './41-pipeline-etapas-venta/03-useFlowTable'
export { useOrderActions } from './39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos'
export { useReservationExpiry } from './38-pipeline-reserva-pedidos/03-useReservationExpiry'
export {
  orderStatusName,
  useInvoiceableCount,
  useOrderMetrics,
  usePendingOrdersCount,
  useQuoteOrderLink,
  useRecentOrders,
  useReservedStock,
} from './35-pipeline-consulta-pedidos/00-director-consulta-pedidos'
export { isInvoiceable, ORDER_STATUSES } from './39-pipeline-transiciones-pedidos/02-orderFlow'
export { orderSearchFields } from './42-pipeline-persistencia-pedidos/02-order.service'
export { SALES_MODALS } from './39-pipeline-transiciones-pedidos/05-modals'
export { EditOrderPage } from './36-pipeline-preparacion-pedidos/02-EditOrderPage'
export { NewOrderPage } from './36-pipeline-preparacion-pedidos/00-director-preparacion-pedidos'
export { OrdersPage } from './34-pipeline-listado-pedidos/00-director-listado-pedidos'
export { startOrderFromQuote } from './43-pipeline-reglas-pedidos/00-director-reglas-pedidos'
export { findOrder, getSalesSnapshot, resetSales, setOrderInvoice, useSalesStore } from './42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos'
export type { Channel, Order, OrderCharge, OrderItem, OrderMetrics, OrderPrefill, OrderStatus, OrderStatusId } from './42-pipeline-persistencia-pedidos/05-types'
