import { formatCurrency } from '@/shared/lib/currency'
import { tracer } from '@/ui-traceability'
import type { OrderActions } from '../../hooks/useOrderActions'
import type { Order } from '../../types'
import { OrderActionButtons } from '../OrderActionButtons'
import { OrderStatusBadge } from '../OrderStatusBadge'

const t = tracer('OrderRow', 'src/features/sales/components/orders/OrderRow.tsx')

interface OrderRowProps {
  order: Order
  actions: OrderActions
}

/**
 * Fila de pedido. Las acciones dependen del estado (máquina de estados):
 * Registrado → Confirmar · Confirmado y Listo → Facturar · Facturado → Entregar · Cancelar antes de facturar.
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
        {o.quoteId && <p className="text-[10px] text-slate-400">Desde {o.quoteId}</p>}
      </td>
      <td className="py-3 px-3">
        <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          {o.client}
          {!o.customerId && <span className="text-[9px] font-bold text-slate-400 uppercase">Ocasional</span>}
        </p>
        <p className="text-[10px] text-slate-400">
          {o.phone} · {o.city}
        </p>
      </td>
      <td className="py-3 px-3">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{o.channel}</p>
        <p className="text-[10px] text-slate-400">{o.date}</p>
      </td>
      <td className="py-3 px-3 text-right">
        <p className="font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(o.total)}</p>
        <p className="text-[10px] text-slate-400">{o.items.reduce((acc, i) => acc + i.quantity, 0)} unid.</p>
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
            <i className="fa-solid fa-file-invoice" aria-hidden="true" /> Ver factura
          </button>
        ) : (
          <span className="text-[11px] text-slate-400" title="Se factura cuando el pedido está Confirmado y Listo">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        <OrderActionButtons
          buttons={actions.actionsFor(o)}
          onRun={(action) => actions.run(action, o)}
          traceId={`sales.table.actions.${o.id}`}
          emptyLabel={o.status === 'entregado' ? 'Ciclo cerrado' : o.status === 'cancelado' ? 'Cancelado' : 'Sólo lectura'}
        />
      </td>
    </tr>
  )
}
