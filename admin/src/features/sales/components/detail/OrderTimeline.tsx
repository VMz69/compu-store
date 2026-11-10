import { formatDateTime } from '@/shared/lib/date'
import type { OrderDetailApi } from '../../hooks/useOrderDetail'

/** Historial del pedido (más reciente primero): quién lo movió de estado y cuándo. */
export function OrderTimeline({ timeline }: Pick<OrderDetailApi, 'timeline'>) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Historial</h4>
      <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-3">
        {timeline.map((e, i) => (
          <li key={`${e.status}-${e.at}`} className="pl-4 relative">
            <span
              className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${i === 0 ? 'bg-brand text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
              aria-hidden="true"
            >
              <i className={`fa-solid ${e.icon}`} />
            </span>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{e.name}</p>
            <p className="text-[10px] text-slate-400">
              {formatDateTime(e.at)} · {e.by}
            </p>
            {e.note && <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{e.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
