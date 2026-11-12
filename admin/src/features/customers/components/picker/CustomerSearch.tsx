import { cn } from '@/shared/lib/cn'
import { controlTone } from '@/shared/ui/controlStyles'
import { tracer } from '@/00-trazabilidad'
import type { CustomerCombobox } from '../../hooks/useCustomerCombobox'
import { CustomerOption } from './CustomerOption'

const t = tracer('CustomerSearch', 'src/features/customers/components/picker/CustomerSearch.tsx')

interface CustomerSearchProps {
  cb: CustomerCombobox
  invalid: boolean
  traceId: string
  inputId?: string
}

/** Input de búsqueda + lista desplegable de clientes del directorio. */
export function CustomerSearch({ cb, invalid, traceId, inputId }: CustomerSearchProps) {
  const hasQuery = cb.query.trim().length > 0
  const hidden = cb.totalMatches - cb.results.length

  return (
    <div className="relative" {...t(`${traceId}.search`)}>
      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none" aria-hidden="true" />
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        autoFocus={cb.focusInput}
        placeholder="Nombre, teléfono, correo o DUI/NIT…"
        aria-invalid={invalid || undefined}
        className={cn('h-9 w-full pl-8 pr-3 rounded-lg text-xs', controlTone('default', invalid))}
        {...cb.inputProps}
        {...t(`${traceId}.input`)}
      />

      {cb.open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-dropdown dark:shadow-modal-dark p-1 animate-fade-in">
          {cb.results.length > 0 ? (
            <ul id={cb.listId} role="listbox" aria-label="Clientes del directorio" className="max-h-72 overflow-y-auto custom-scrollbar space-y-0.5">
              {cb.results.map((c, i) => (
                <CustomerOption
                  key={c.id}
                  customer={c}
                  domId={cb.optionId(c.id)}
                  active={i === cb.activeIndex}
                  traceId={traceId}
                  onHover={() => cb.setActiveIndex(i)}
                  onChoose={() => cb.choose(c.id)}
                />
              ))}
            </ul>
          ) : (
            <div id={cb.listId} role="listbox" aria-label="Clientes del directorio" className="px-3 py-4 text-center space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {hasQuery ? <>Sin coincidencias para «{cb.query.trim()}».</> : 'No hay clientes activos en el directorio.'}
              </p>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={cb.useAsWalkin}
                className="text-[11px] font-bold text-brand hover:text-brand-hover"
                {...t(`${traceId}.useWalkin`)}
              >
                <i className={cn('fa-solid mr-1', cb.registerNew ? 'fa-user-plus' : 'fa-user-clock')} aria-hidden="true" />
                {cb.registerNew ? 'Registrar como cliente nuevo' : 'Registrar como cliente ocasional'}
              </button>
            </div>
          )}
          <p className="px-2.5 pt-1.5 pb-1 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between gap-2">
            <span>{hidden > 0 ? `+${hidden} más: afina la búsqueda` : `${cb.totalMatches} cliente(s)`}</span>
            <span className="hidden sm:inline">↑↓ navegar · Enter elegir · Esc cerrar</span>
          </p>
        </div>
      )}
    </div>
  )
}
