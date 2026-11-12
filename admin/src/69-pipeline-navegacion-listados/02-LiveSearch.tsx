import type { ChangeEvent } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'

interface LiveSearchProps {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder: string
  'aria-label': string
  /** Resultados visibles con el filtro actual (se anuncian a lectores de pantalla). */
  resultCount?: number
  autoFocus?: boolean
  wrapperClassName?: string
}

/**
 * Buscador en tiempo real: filtra mientras se escribe, botón y Escape para limpiar,
 * y conteo de resultados. Las props extra (trazabilidad) van al <input>.
 */
export function LiveSearch({ value, onChange, onClear, placeholder, resultCount, wrapperClassName = 'w-full sm:w-80 xl:w-96', ...rest }: LiveSearchProps) {
  const active = value.trim().length > 0

  return (
    <div className={cn('flex items-center gap-2', wrapperClassName)}>
      <div className="relative flex-1 min-w-0">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && active) {
              e.stopPropagation()
              onClear()
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'w-full h-8 pl-8 rounded-lg border text-xs font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all',
            active ? 'pr-8 border-brand/50' : 'pr-3 border-slate-200 dark:border-slate-700 focus:border-brand',
          )}
          {...rest}
        />
        {active && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            title="Limpiar (Esc)"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700"
          >
            <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
          </button>
        )}
      </div>
      {active && resultCount !== undefined && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </span>
      )}
    </div>
  )
}
