import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/currency'
import { Button, Calendar, Modal, ModalFooter, ModalHeader, ModalTitle } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useReserveOrder } from '../../hooks/useReserveOrder'
import { RESERVATION } from '../../lib/reservation'

const t = tracer('ReserveOrderModal', 'src/features/sales/components/reserve/ReserveOrderModal.tsx')

const CHIP = 'px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors'

/** "Confirmar y reservar": vigencia de la reserva con calendario propio y reglas visibles. */
export function ReserveOrderModal() {
  const r = useReserveOrder()
  if (!r.order) return null
  const o = r.order
  const canSubmit = !r.error && !r.blocked && r.shortages.length === 0

  return (
    <Modal onClose={r.onClose} widthClass="w-[min(94vw,680px)]" className="max-h-[92vh]" {...t('sales.reserve')}>
      <ModalHeader onClose={r.onClose} closeMeta={t('sales.reserve.close')}>
        <ModalTitle icon="fa-solid fa-lock">Confirmar y reservar · {o.id}</ModalTitle>
        <p className="text-[11px] text-slate-400 mt-0.5">{o.client} · {o.items.length} producto(s), {r.units} unidad(es) · {formatCurrency(o.total)}</p>
      </ModalHeader>

      <div className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] gap-6 text-xs">
        <div className="space-y-3" {...t('sales.reserve.calendar')}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Reservar hasta</p>
          <Calendar value={r.until} onSelect={r.setUntil} min={r.bounds.min} max={r.bounds.max} rangeStart={r.today} />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Atajos de vigencia">
            {r.quick.map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => r.setUntil(q.iso)}
                aria-pressed={q.active}
                className={cn(CHIP, q.active ? 'bg-brand text-white border-brand' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand')}
                {...t(`sales.reserve.quick.${q.days}`)}
              >
                +{q.days} {q.days === 1 ? 'día' : 'días'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-brand/30 bg-brand-50/60 dark:bg-brand/10" aria-live="polite" {...t('sales.reserve.summary')}>
            <p className="text-[10px] font-black uppercase tracking-wider text-brand">Vigencia de la reserva</p>
            {r.summary ? (
              <>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 capitalize">{r.summary.date}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.summary.daysLabel}</p>
              </>
            ) : (
              <p role="alert" className="text-[11px] font-semibold text-red-600 dark:text-red-400">{r.error}</p>
            )}
          </div>

          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <li><i className="fa-solid fa-box text-brand w-4" aria-hidden="true" />Las unidades quedan apartadas: no se podrán vender en otro pedido si se agota el disponible.</li>
            <li><i className="fa-solid fa-globe text-brand w-4" aria-hidden="true" />Si un producto queda sin disponible, se oculta temporalmente en la tienda web.</li>
            <li><i className="fa-solid fa-clock-rotate-left text-amber-500 w-4" aria-hidden="true" />Si vence sin facturarse, el stock se libera y el pedido vuelve a <b>Registrado</b>.</li>
          </ul>

          {r.shortages.length > 0 && (
            <div role="alert" className="p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-[11px] text-red-700 dark:text-red-300" {...t('sales.reserve.shortages')}>
              <p className="font-bold mb-1">Stock insuficiente para reservar:</p>
              {r.shortages.map((s) => <p key={s.productId}>{s.name}: pide {s.requested}, disponible {s.available}</p>)}
            </div>
          )}
          {r.blocked && <p role="alert" className="text-[11px] font-semibold text-red-600 dark:text-red-400">{r.blocked}</p>}
          <p className="text-[10px] text-slate-400">Máximo {RESERVATION.maxDays} días. La fecha elegida se incluye completa.</p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" size="md" onClick={r.onClose} {...t('sales.reserve.cancel')}>Cancelar</Button>
        <Button size="md" icon="fa-solid fa-lock" disabled={!canSubmit} onClick={r.submit} {...t('sales.reserve.submit')}>Confirmar y reservar</Button>
      </ModalFooter>
    </Modal>
  )
}
