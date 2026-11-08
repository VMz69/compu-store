import { DataTable, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderActions } from '../../hooks/useOrderActions'
import type { Order } from '../../types'
import { OrderRow } from './OrderRow'

const t = tracer('OrdersTable', 'src/features/sales/components/orders/OrdersTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Orden', className: 'px-4' },
  { label: 'Cliente' },
  { label: 'Canal & Fecha' },
  { label: 'Total USD', className: 'px-3 text-right' },
  { label: 'Estado Actual' },
  { label: 'Factura' },
  { label: 'Transición Operativa', className: 'px-4 text-right' },
]

interface OrdersTableProps {
  orders: Order[]
  actions: OrderActions
}

export function OrdersTable({ orders, actions }: OrdersTableProps) {
  return (
    <DataTable headers={HEADERS} {...t('sales.table')}>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} actions={actions} />
      ))}
    </DataTable>
  )
}
