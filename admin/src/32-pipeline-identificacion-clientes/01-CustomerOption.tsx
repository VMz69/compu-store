import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { stopPropagation } from '@/83-pipeline-recursos-publicos/03-events'
import { tracer } from '@/00-trazabilidad'
import type { Customer } from '../33-pipeline-historial-clientes/03-types'
import { CustomerInitials } from './02-CustomerInitials'

const t = tracer('CustomerOption', 'src/features/customers/components/picker/CustomerOption.tsx')

interface CustomerOptionProps {
  customer: Customer
  domId: string
  active: boolean
  traceId: string
  onHover: () => void
  onChoose: () => void
}

/** Fila de resultado del buscador de clientes (role="option"). */
export function CustomerOption({ customer: c, domId, active, traceId, onHover, onChoose }: CustomerOptionProps) {
  const detail = [c.phone, c.email || c.city].filter(Boolean).join(' · ')

  return (
    <li
      id={domId}
      role="option"
      aria-selected={active}
      // mousedown en vez de click: el input no pierde el foco antes de elegir.
      onMouseDown={(event) => {
        event.preventDefault()
        stopPropagation(event)
        onChoose()
      }}
      onMouseEnter={onHover}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
        active ? 'bg-brand-50 dark:bg-brand/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800',
      )}
      {...t(`${traceId}.option.${c.id}`)}
    >
      <CustomerInitials name={c.name} type={c.type} className="w-8 h-8 text-[11px]" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={c.name}>{c.name}</span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{detail}</span>
      </span>
      {c.type === 'empresa' && (
        <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Empresa</span>
      )}
      {active && <i className="fa-solid fa-arrow-turn-down rotate-90 text-[10px] text-brand shrink-0" aria-hidden="true" />}
    </li>
  )
}
