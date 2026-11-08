import { formatCurrency } from '@/shared/lib/currency'
import { Button, Modal, ModalFooter, ModalHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useStatusDetail } from '../../hooks/usePipeline'

const t = tracer('StatusDetailModal', 'src/features/sales/components/pipeline/StatusDetailModal.tsx')

const SECTION_LABEL = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider'
const PANEL = 'p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'

export function StatusDetailModal() {
  const detail = useStatusDetail()
  if (!detail) return null
  const { status: s, orders, onClose, onShowOrders } = detail

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,520px)]" {...t(`settings.status-detail.${s.id}`)}>
      <ModalHeader onClose={onClose} closeMeta={t('settings.status-detail.close')}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs font-bold">
            {s.step > 0 ? `P${s.step}` : '✕'}
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Transición Operativa · {s.name}
          </h3>
        </div>
      </ModalHeader>

      <div className="p-5 space-y-4 text-xs">
        <div>
          <h4 className={`${SECTION_LABEL} mb-1`}>Criterio Operativo</h4>
          <p className={`${PANEL} text-slate-700 dark:text-slate-200 font-medium leading-relaxed`}>{s.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={PANEL}>
            <span className={SECTION_LABEL}>Órdenes en este Estado</span>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">{orders.length} pedidos</p>
          </div>
          <div className={PANEL}>
            <span className={SECTION_LABEL}>Siguiente Paso Permitido</span>
            <p className="text-xs font-bold text-brand mt-1.5 flex flex-wrap gap-1">
              {s.nextPossible.length > 0 ? (
                s.nextPossible.map((next) => (
                  <span key={next} className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[10px]">
                    ➔ {next}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-[10px]">Estado Terminal (Fin de ciclo)</span>
              )}
            </p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div>
            <h4 className={`${SECTION_LABEL} mb-2`}>Órdenes Activas en {s.name}</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
              {orders.map((o) => (
                <div key={o.id} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div>
                    <span className="font-mono font-bold text-brand">{o.id}</span> ·{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{o.client}</span>
                    <p className="text-[10px] text-slate-400">
                      {o.channel} · {o.city}
                    </p>
                  </div>
                  <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center py-3 text-slate-400 italic">No hay órdenes actualmente en este estado.</p>
        )}
      </div>

      <ModalFooter>
        <button
          type="button"
          className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5"
          onClick={onShowOrders}
          {...t('settings.status-detail.orders')}
        >
          <i className="fa-solid fa-cart-shopping text-xs" aria-hidden="true" /> Abrir vista de Pedidos filtrada
        </button>
        <Button size="xs" onClick={onClose} {...t('settings.status-detail.dismiss')}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
