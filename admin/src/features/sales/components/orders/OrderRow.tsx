import { formatCurrency } from '@/shared/lib/currency'
import { Button } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderActions } from '../../hooks/useOrderActions'
import type { Order } from '../../types'
import { OrderStatusBadge } from '../OrderStatusBadge'
import { OrderStatusSelect } from '../OrderStatusSelect'

const t = tracer('OrderRow', 'src/features/sales/components/orders/OrderRow.tsx')

interface OrderRowProps {
  order: Order
  actions: OrderActions
}

/**
 * Fila de pedido. La columna "Factura" conecta con Facturación:
 * - Facturado → enlace al PDF de la factura.
 * - Facturable → botón "Facturar" (abre la emisión en Facturación).
 * - Pendiente/Cancelado → no aplica (se explica en el tooltip).
 */
export function OrderRow({ order: o, actions }: OrderRowProps) {
  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`sales.table.row.${o.id}`)}>
      <td className="py-3 px-4">
        <button
          type="button"
          className="font-mono font-bold text-brand hover:underline flex items-center gap-1.5"
          onClick={() => actions.openDetail(o.id)}
          {...t(`sales.table.detail.${o.id}`)}
        >
          <i className="fa-solid fa-receipt text-[11px]" aria-hidden="true" /> {o.id}
        </button>
      </td>
      <td className="py-3 px-3">
        <p className="font-bold text-slate-800 dark:text-slate-100">{o.client}</p>
        <p className="text-[10px] text-slate-400">
          {o.phone} · {o.city}
        </p>
      </td>
      <td className="py-3 px-3">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{o.channel}</p>
        <p className="text-[10px] text-slate-400">{o.date}</p>
      </td>
      <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-100">
        {formatCurrency(o.total)}
      </td>
      <td className="py-3 px-3">
        <OrderStatusBadge status={o.status} />
      </td>
      <td className="py-3 px-3">
        {o.invoiceId ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            title={`Ver factura ${o.invoiceId}`}
            onClick={() => actions.viewInvoice(o.invoiceId ?? '')}
            {...t(`sales.table.invoice.view.${o.id}`)}
          >
            <i className="fa-solid fa-file-invoice" aria-hidden="true" /> Facturado
          </button>
        ) : actions.isInvoiceable(o) && actions.canInvoice ? (
          <Button variant="tint" size="xs" icon="fa-solid fa-file-invoice-dollar" onClick={() => actions.invoice(o.id)} {...t(`sales.table.invoice.create.${o.id}`)}>
            Facturar
          </Button>
        ) : (
          <span className="text-[11px] text-slate-400" title="Se factura cuando el pedido está confirmado">
            —
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        {actions.canChangeStatus ? (
          <OrderStatusSelect
            orderId={o.id}
            value={o.status}
            options={actions.statusOptions}
            onChange={actions.changeStatus}
            lockedReason={o.invoiceId ? 'Pedido facturado: anula la factura para modificar su estado' : undefined}
          />
        ) : (
          <span className="text-xs text-slate-400">Sólo lectura</span>
        )}
      </td>
    </tr>
  )
}
