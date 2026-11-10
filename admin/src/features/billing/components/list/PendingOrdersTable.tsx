import { OrderStatusBadge, type Order } from '@/features/sales'
import { formatCurrency } from '@/shared/lib/currency'
import { Button, DataTable, EmptyState, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('PendingOrdersTable', 'src/features/billing/components/list/PendingOrdersTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Pedido', className: 'px-4' },
  { label: 'Cliente' },
  { label: 'Productos' },
  { label: 'Estado' },
  { label: 'Total', className: 'px-3 text-right' },
  { label: 'Acción', className: 'px-4 text-right' },
]

interface PendingOrdersTableProps {
  orders: Order[]
  canInvoice: boolean
  onInvoice: (orderId: string) => void
}

/** Cola de pedidos "Confirmado y Listo" que aún no tienen factura. */
export function PendingOrdersTable({ orders, canInvoice, onInvoice }: PendingOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-circle-check"
        title="Todo al día: no hay pedidos por facturar."
        hint="Los pedidos aparecen aquí cuando están en estado Confirmado y Listo."
        {...t('billing.pending.empty')}
      />
    )
  }

  return (
    <DataTable headers={HEADERS} {...t('billing.pending.table')}>
      {orders.map((o) => (
        <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`billing.pending.row.${o.id}`)}>
          <td className="py-3 px-4">
            <p className="font-mono font-bold text-brand">{o.id}</p>
            <p className="text-[10px] text-slate-400">{o.date} · {o.channel}</p>
          </td>
          <td className="py-3 px-3">
            <p className="font-bold text-slate-800 dark:text-slate-100">{o.client}</p>
            <p className="text-[10px] text-slate-400">{o.phone}</p>
          </td>
          <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300 max-w-xs">
            <span className="line-clamp-2">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
          </td>
          <td className="py-3 px-3">
            <OrderStatusBadge status={o.status} />
          </td>
          <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(o.total)}</td>
          <td className="py-3 px-4 text-right">
            {canInvoice ? (
              <Button size="xs" icon="fa-solid fa-file-invoice-dollar" onClick={() => onInvoice(o.id)} {...t(`billing.pending.invoice.${o.id}`)}>
                Facturar
              </Button>
            ) : (
              <span className="text-[11px] text-slate-400">Sin permiso</span>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
