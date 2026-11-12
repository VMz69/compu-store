import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { localStampParts } from '@/71-pipeline-seleccion-fechas/05-date'
import { clickable, isolate } from '@/83-pipeline-recursos-publicos/03-events'
import { IconButton } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OrderActions } from '../39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos'
import type { Order } from '../42-pipeline-persistencia-pedidos/05-types'
import { OrderActionButtons } from '../37-pipeline-detalle-pedidos/05-OrderActionButtons'
import { OrderStatusBadge } from '../39-pipeline-transiciones-pedidos/04-OrderStatusBadge'
import { ReservationTag } from '../38-pipeline-reserva-pedidos/05-ReservationTag'

const t = tracer('OrderRow', 'src/34-pipeline-listado-pedidos/04-OrderRow.tsx')

interface OrderRowProps {
  order: Order
  actions: OrderActions
}

/**
 * Fila de pedido. Las acciones dependen del estado (máquina de estados):
 * Registrado → Confirmar y reservar · Reservado → Facturar · Facturado → Entregar · Cancelar antes de facturar.
 * Toda la fila abre el detalle; las celdas con botones propios se aíslan para no dispararlo.
 */
export function OrderRow({ order: o, actions }: OrderRowProps) {
  const when = localStampParts(o.date)
  return (
    <tr
      className="group cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 focus-visible:outline-none focus-visible:bg-brand-50/60 dark:focus-visible:bg-brand/10 transition-colors"
      title={`Ver detalle del pedido ${o.id}`}
      // Se conserva el rol de fila (semántica de tabla); solo se toma foco y Enter/Espacio.
      {...clickable(() => actions.openDetail(o.id))}
      role={undefined}
      {...t(`sales.table.row.${o.id}`)}
    >
      <td className="py-3 px-4">
        <span className="font-mono font-bold text-brand group-hover:underline flex items-center gap-1.5" {...t(`sales.table.detail.${o.id}`)}>
          <i className="fa-solid fa-receipt text-[11px]" aria-hidden="true" /> {o.id}
        </span>
        {o.quoteId && <p className="text-[10px] text-slate-400">Desde {o.quoteId}</p>}
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <time dateTime={o.date.replace(' ', 'T')} className="block font-semibold text-slate-700 dark:text-slate-200">{when.date}</time>
        <p className="text-[10px] text-slate-400">{when.time}</p>
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
      </td>
      <td className="py-3 px-3 text-right">
        <p className="font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(o.total)}</p>
        <p className="text-[10px] text-slate-400">{o.items.reduce((acc, i) => acc + i.quantity, 0)} unid.</p>
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col items-start gap-1">
          <OrderStatusBadge status={o.status} />
          {o.status === 'confirmado' && <ReservationTag until={o.reservedUntil} />}
        </div>
      </td>
      <td className="py-3 px-3" {...isolate}>
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
          <span className="text-[11px] text-slate-400" title="Se factura cuando el pedido está Reservado">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-right cursor-default" {...isolate}>
        <div className="flex items-center justify-end gap-1.5">
          <OrderActionButtons
            buttons={actions.actionsFor(o)}
            onRun={(action) => actions.run(action, o)}
            traceId={`sales.table.actions.${o.id}`}
            emptyLabel={o.status === 'entregado' ? 'Ciclo cerrado' : o.status === 'cancelado' ? 'Cancelado' : 'Sólo lectura'}
          />
          {actions.canDelete(o) && (
            <IconButton
              icon="fa-solid fa-trash-can"
              label={`Eliminar pedido ${o.id}`}
              tone="plain"
              sizeClass="w-7 h-7"
              className="hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!"
              onClick={() => actions.remove(o)}
              {...t(`sales.table.delete.${o.id}`)}
            />
          )}
        </div>
      </td>
    </tr>
  )
}
