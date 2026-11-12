import { tracer } from '@/00-trazabilidad'
import type { Customer } from '../33-pipeline-historial-clientes/03-types'

const t = tracer('DuplicateCustomerNotice', 'src/32-pipeline-identificacion-clientes/04-DuplicateCustomerNotice.tsx')

interface DuplicateCustomerNoticeProps {
  customer: Customer
  traceId: string
  onUse: () => void
}

/** El teléfono escrito ya pertenece a un cliente: se ofrece usarlo en vez de duplicarlo. */
export function DuplicateCustomerNotice({ customer: c, traceId, onUse }: DuplicateCustomerNoticeProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2"
      {...t(`${traceId}.duplicate`)}
    >
      <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400 text-xs" aria-hidden="true" />
      <p className="flex-1 min-w-0 text-[11px] leading-snug text-amber-800 dark:text-amber-200">
        Este teléfono ya pertenece a <strong className="font-bold">{c.name}</strong>
        {c.active ? '.' : ', un cliente inactivo. Reactívalo en Clientes o usa otro número.'}
      </p>
      {c.active && (
        <button
          type="button"
          onClick={onUse}
          className="shrink-0 text-[11px] font-bold text-amber-800 dark:text-amber-200 px-2 py-1 rounded-md bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-colors"
          {...t(`${traceId}.useDuplicate`)}
        >
          Usar este cliente
        </button>
      )}
    </div>
  )
}
