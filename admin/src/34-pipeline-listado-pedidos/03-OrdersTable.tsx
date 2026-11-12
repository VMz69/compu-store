import type { SortState } from '@/82-pipeline-calculo-importes/03-sort'
import { DataTable, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OrderActions } from '../39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos'
import type { Order } from '../42-pipeline-persistencia-pedidos/05-types'
import { OrderRow } from './04-OrderRow'

const t = tracer('OrdersTable', 'src/34-pipeline-listado-pedidos/03-OrdersTable.tsx')

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
