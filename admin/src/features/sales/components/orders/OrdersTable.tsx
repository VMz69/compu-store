import type { SortState } from '@/shared/lib/sort'
import { DataTable, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderActions } from '../../hooks/useOrderActions'
import type { Order } from '../../types'
import { OrderRow } from './OrderRow'

const t = tracer('OrdersTable', 'src/features/sales/components/orders/OrdersTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Orden', className: 'px-4', sortKey: 'id' },
  { label: 'Fecha', sortKey: 'date' },
  { label: 'Cliente', sortKey: 'client' },
  { label: 'Canal' },
  { label: 'Total USD', className: 'px-3 text-right', sortKey: 'total', alignEnd: true },
  { label: 'Estado', sortKey: 'status' },
  { label: 'Factura' },
  { label: 'Siguiente paso', className: 'px-4 text-right' },
]

interface OrdersTableProps {
  orders: Order[]
  actions: OrderActions
  sort: SortState
  onSort: (key: string) => void
}

export function OrdersTable({ orders, actions, sort, onSort }: OrdersTableProps) {
  return (
    <DataTable headers={HEADERS} sort={sort} onSort={onSort} sortTraceId="sales.table.sort" {...t('sales.table')}>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} actions={actions} />
      ))}
    </DataTable>
  )
}
