import { Button, Modal, ModalHeader, ModalTitle } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useInvoiceEmit } from '../../hooks/useInvoiceEmit'
import { ReceptorFields } from './ReceptorFields'
import { StockCheck } from './StockCheck'

const t = tracer('InvoiceEmitModal', 'src/features/billing/components/emit/InvoiceEmitModal.tsx')

/**
 * Emitir factura de un pedido. Un solo paso: revisar detalle/stock → datos del
 * receptor → "Emitir factura". El aviso inferior explica qué ocurrirá.
 */
export function InvoiceEmitModal() {
  const f = useInvoiceEmit()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,620px)]" className="max-h-[92vh]" {...t('billing.emit')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('billing.emit.close')}>
        <ModalTitle icon="fa-solid fa-file-invoice-dollar">Facturar pedido {f.order?.id}</ModalTitle>
        {f.order && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {f.order.client} · {f.order.channel} · {f.order.date}
          </p>
        )}
      </ModalHeader>

      {f.blockedReason ? (
        <div className="p-6 text-center space-y-3" role="alert">
          <i className="fa-solid fa-circle-info text-2xl text-amber-500" aria-hidden="true" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{f.blockedReason}</p>
          <Button variant="outline" onClick={f.onClose} {...t('billing.emit.dismiss')}>
            Entendido
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={f.onSubmit} className="flex-1 min-h-0 flex flex-col text-xs" {...t('billing.emit.form')}>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-5">
            <StockCheck items={f.items} availability={f.availability} totals={f.totals} />
            <ReceptorFields f={f} />
          </div>

          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 shrink-0">
            <p
              className={
                f.stockOk
                  ? 'text-[11px] text-slate-500 dark:text-slate-400 flex gap-2'
                  : 'text-[11px] font-semibold text-red-600 dark:text-red-400 flex gap-2'
              }
              role={f.stockOk ? undefined : 'alert'}
            >
              <i className={f.stockOk ? 'fa-solid fa-circle-info text-brand mt-0.5' : 'fa-solid fa-triangle-exclamation mt-0.5'} aria-hidden="true" />
              {f.stockOk
                ? 'Al emitir se descontará el inventario y el pedido pasará a "Entregado". Podrás anular la factura si fue un error.'
                : 'No hay stock suficiente para facturar este pedido. Ajusta el inventario en Productos y vuelve a intentarlo.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={f.onClose} {...t('billing.emit.cancel')}>
                Cancelar
              </Button>
              <Button type="submit" size="md" icon="fa-solid fa-file-invoice" disabled={!f.stockOk} isLoading={f.isLoading} {...t('billing.emit.submit')}>
                Emitir factura
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
