import { Button, Modal, ModalFooter, ModalHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useOrderDetail } from './02-useOrderDetail'
import { OrderActionButtons } from './05-OrderActionButtons'
import { OrderStatusBadge } from '../39-pipeline-transiciones-pedidos/04-OrderStatusBadge'
import { ReservationTag } from '../38-pipeline-reserva-pedidos/05-ReservationTag'
import { OrderLines } from './03-OrderLines'
import { OrderTimeline } from './04-OrderTimeline'

const t = tracer('OrderDetailModal', 'src/37-pipeline-detalle-pedidos/01-OrderDetailModal.tsx')

const PANEL = 'bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800'

/** Comprobante del pedido: cliente, artículos, vínculos (cotización/factura), historial y acciones del flujo. */
export function OrderDetailModal() {
  const detail = useOrderDetail()
  if (!detail) return null
  const { order: o, status, onClose } = detail

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,640px)]" className="max-h-[92vh]" {...t(`sales.order-detail.${o.id}`)}>
      <ModalHeader onClose={onClose} closeMeta={t('sales.order-detail.close')}>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Pedido · {o.id}</h3>
          <OrderStatusBadge status={o.status} />
        </div>
        <p className="text-[10px] text-slate-400">
          {o.date} · Canal: <b className="text-slate-600 dark:text-slate-300">{o.channel}</b>
        </p>
      </ModalHeader>

      <div className="p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <i className={`fa-solid ${status.icon} text-brand mt-0.5`} aria-hidden="true" /> {status.description}
        </p>
        {detail.reservation && (
          <p className="flex items-center justify-between gap-2 p-3 rounded-xl border border-brand/30 bg-brand-50/60 dark:bg-brand/10 text-[11px]" {...t('sales.order-detail.reservation')}>
            <span className="text-slate-700 dark:text-slate-200"><i className="fa-solid fa-lock text-brand mr-1.5" aria-hidden="true" />Reservado hasta <b className="capitalize">{detail.reservation.date}</b> (23:59)</span>
            <ReservationTag until={detail.reservation.until} />
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={PANEL}>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</h4>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{o.client}</p>
            <p className="text-slate-500 mt-0.5">{o.phone} · {o.city}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{o.customerId ? `Directorio ${o.customerId}` : 'Cliente ocasional'}{o.email && ` · ${o.email}`}</p>
          </div>
          <div className={PANEL}>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pago y entrega</h4>
            <p className="font-bold text-slate-700 dark:text-slate-200">{o.paymentMethod}</p>
            <p className="text-slate-500 mt-0.5">{o.deliveryMethod}</p>
            <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] font-bold">
              {o.quoteId && <span className="text-slate-500"><i className="fa-solid fa-file-signature mr-1" aria-hidden="true" />{o.quoteId}</span>}
              {o.invoiceId && (
                <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline" onClick={detail.viewInvoice} {...t('sales.order-detail.invoice')}>
                  <i className="fa-solid fa-file-invoice mr-1" aria-hidden="true" />Ver factura
                </button>
              )}
            </div>
          </div>
        </div>

        {o.notes && <p className={`${PANEL} text-[11px] text-slate-600 dark:text-slate-300`}><b>Notas:</b> {o.notes}</p>}
        <OrderLines lines={detail.lines} charges={detail.charges} totals={detail.totals} />
        <OrderTimeline timeline={detail.timeline} />
      </div>

      <ModalFooter>
        <div className="flex items-center gap-3">
          <a href={detail.notifyLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-whatsapp hover:underline flex items-center gap-1.5" {...t('sales.order-detail.notify')}>
            <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true" /> Notificar
          </a>
          {detail.canDelete && (
            <button type="button" onClick={detail.remove} className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline flex items-center gap-1.5" {...t(`sales.order-detail.delete.${o.id}`)}>
              <i className="fa-solid fa-trash-can text-[11px]" aria-hidden="true" /> Eliminar
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {detail.canEdit && (
            <Button variant="outline" size="md" icon="fa-solid fa-pen" onClick={detail.edit} title="Abre el pedido en el constructor para modificarlo" {...t(`sales.order-detail.edit.${o.id}`)}>
              Editar
            </Button>
          )}
          <OrderActionButtons buttons={detail.buttons} onRun={detail.run} traceId={`sales.order-detail.actions.${o.id}`} size="md" emptyLabel="" />
        </div>
      </ModalFooter>
    </Modal>
  )
}
