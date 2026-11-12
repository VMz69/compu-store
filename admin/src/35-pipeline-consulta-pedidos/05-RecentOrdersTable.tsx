import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { DataTable, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { Order } from '../42-pipeline-persistencia-pedidos/05-types'
import { OrderStatusBadge } from '../39-pipeline-transiciones-pedidos/04-OrderStatusBadge'

const t = tracer('RecentOrdersTable', 'src/35-pipeline-consulta-pedidos/05-RecentOrdersTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'ID Pedido' },
  { label: 'Cliente' },
  { label: 'Canal' },
  { label: 'Total' },
  { label: 'Estado' },
]

/** Tabla compacta de órdenes recientes (panel del tablero). */
export function RecentOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <DataTable headers={HEADERS} dense {...t('sales.recent.table')}>
      {orders.map((o) => (
        <tr
          key={o.id}
          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
          {...t(`sales.recent.row.${o.id}`)}
        >
          <td className="py-2.5 px-3 font-mono font-bold text-brand">{o.id}</td>
          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{o.client}</td>
          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{o.channel}</td>
          <td className="py-2.5 px-3 font-black text-slate-800 dark:text-slate-100">{formatCurrency(o.total)}</td>
          <td className="py-2.5 px-3">
            <OrderStatusBadge status={o.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
