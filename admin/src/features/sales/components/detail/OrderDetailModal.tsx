import { formatCurrency } from '@/shared/lib/currency'
import { Button, Modal, ModalFooter, ModalHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useOrderDetail } from '../../hooks/useOrderDetail'
import { OrderStatusBadge } from '../OrderStatusBadge'

const t = tracer('OrderDetailModal', 'src/features/sales/components/detail/OrderDetailModal.tsx')

export function OrderDetailModal() {
  const detail = useOrderDetail()
  if (!detail) return null
  const { order: o, lines, notifyLink, onClose } = detail

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,500px)]" {...t(`sales.order-detail.${o.id}`)}>
      <ModalHeader onClose={onClose} closeMeta={t('sales.order-detail.close')}>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Comprobante · {o.id}
          </h3>
          <OrderStatusBadge status={o.status} />
        </div>
        <p className="text-[10px] text-slate-400">
          {o.date} · Canal: <b className="text-slate-600 dark:text-slate-300">{o.channel}</b>
        </p>
      </ModalHeader>

      <div className="p-5 space-y-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Datos del Comprador</h4>
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{o.client}</p>
          <p className="text-slate-500 mt-0.5">
            Teléfono: <b className="text-slate-700 dark:text-slate-200">{o.phone}</b> · {o.city}
          </p>
          <p className="text-slate-500 mt-0.5">
            Entrega: <b className="text-slate-700 dark:text-slate-200">{o.deliveryMethod}</b>
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose de Artículos</h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {lines.map((line) => (
              <div key={line.productId} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{line.name}</p>
                  <span className="text-[10px] text-slate-400">
                    {line.quantity}x @ {formatCurrency(line.price)}
                  </span>
                </div>
                <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(line.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-bold text-slate-500">Monto Total a Pagar:</span>
          <span className="text-lg font-black text-brand">{formatCurrency(o.total)}</span>
        </div>
      </div>

      <ModalFooter>
        <a
          href={notifyLink}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-whatsapp hover:underline flex items-center gap-1.5"
          {...t('sales.order-detail.notify')}
        >
          <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true" /> Notificar al cliente
        </a>
        <Button size="xs" onClick={onClose} {...t('sales.order-detail.done')}>
          Listo
        </Button>
      </ModalFooter>
    </Modal>
  )
}
