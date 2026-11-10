import { cn } from '@/shared/lib/cn'
import { tracer } from '@/ui-traceability'
import type { OrderStatus, OrderStatusId } from '../../types'
import { OrderStatusBadge } from '../OrderStatusBadge'

const t = tracer('StatusCriteriaRow', 'src/features/sales/components/pipeline/StatusCriteriaRow.tsx')

interface StatusCriteriaRowProps {
  status: OrderStatus
  count: number
  nextNames: string[]
  onShowOrders: (status: OrderStatusId) => void
  onOpenDetail: (status: OrderStatusId) => void
}

/** Fila de criterios: descripción, efecto en otros módulos, disparador y transiciones permitidas. */
export function StatusCriteriaRow({ status: s, count, nextNames, onShowOrders, onOpenDetail }: StatusCriteriaRowProps) {
  const isTerminalCancel = s.step === 0

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`settings.criteria.row.${s.id}`)}>
      <td className="py-3 px-4">
        <button
          type="button"
          title="Ver detalle del estado"
          className="flex items-center gap-2 rounded-md hover:opacity-80"
          onClick={() => onOpenDetail(s.id)}
          {...t(`settings.criteria.detail.${s.id}`)}
        >
          <span
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px]',
              isTerminalCancel
                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
            )}
          >
            {isTerminalCancel ? '✕' : s.step}
          </span>
          <OrderStatusBadge status={s.id} />
        </button>
      </td>
      <td className="py-3 px-3 max-w-xs">
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{s.description}</p>
        <p className="text-[10px] text-slate-400 mt-1">
          <i className="fa-solid fa-hand-pointer mr-1" aria-hidden="true" />
          {s.trigger}
        </p>
      </td>
      <td className="py-3 px-3 max-w-xs">
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{s.effect}</p>
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-wrap gap-1">
          {nextNames.length > 0 ? (
            nextNames.map((next) => (
              <span
                key={next}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                ➔ {next}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">Fin del ciclo (Terminal)</span>
          )}
        </div>
      </td>
      <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px]',
            count > 0 ? 'bg-brand/10 text-brand' : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
          )}
        >
          {count}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
          onClick={() => onShowOrders(s.id)}
          {...t(`settings.criteria.orders.${s.id}`)}
        >
          <i className="fa-solid fa-list-check text-[10px]" aria-hidden="true" /> Ver Pedidos
        </button>
      </td>
    </tr>
  )
}
