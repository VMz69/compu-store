import { tracer } from '@/00-trazabilidad'
import type { Customer } from '../33-pipeline-historial-clientes/03-types'
import { CustomerInitials } from './02-CustomerInitials'

const t = tracer('SelectedCustomerCard', 'src/features/customers/components/picker/SelectedCustomerCard.tsx')

interface SelectedCustomerCardProps {
  customer: Customer
  traceId: string
  onChange: () => void
}

/** Cliente elegido: datos de contacto a la vista y acción para cambiarlo. */
export function SelectedCustomerCard({ customer: c, traceId, onChange }: SelectedCustomerCardProps) {
  const docLabel = c.type === 'empresa' ? 'NIT' : 'DUI'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border border-brand/30 bg-brand-50/60 dark:bg-brand/10 dark:border-brand/30"
      aria-live="polite"
      {...t(`${traceId}.selected`)}
    >
      <CustomerInitials name={c.name} type={c.type} className="w-10 h-10 text-xs" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-black text-slate-800 dark:text-slate-100 break-words">{c.name}</p>
        <p className="text-[11px] text-slate-600 dark:text-slate-300">
          <i className="fa-solid fa-phone text-[9px] mr-1 text-slate-400" aria-hidden="true" />
          {c.phone}
          {c.email && <span className="text-slate-400"> · </span>}
          {c.email}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {c.city || 'Sin ciudad'}
          {' · '}
          {c.documentId ? `${docLabel} ${c.documentId}` : `Sin ${docLabel}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 text-[11px] font-bold text-brand hover:text-brand-hover px-2 py-1 rounded-md hover:bg-white/70 dark:hover:bg-slate-800 transition-colors"
        {...t(`${traceId}.change`)}
      >
        <i className="fa-solid fa-arrows-rotate mr-1" aria-hidden="true" />
        Cambiar
      </button>
    </div>
  )
}
