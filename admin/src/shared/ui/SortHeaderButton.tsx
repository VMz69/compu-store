import { cn } from '@/shared/lib/cn'
import type { SortDir } from '@/shared/lib/sort'
import { tracer } from '@/ui-traceability'

const t = tracer('SortHeaderButton', 'src/shared/ui/SortHeaderButton.tsx')

interface SortHeaderButtonProps {
  label: string
  /** Dirección si la columna es la activa; undefined = no ordena por esta columna. */
  dir?: SortDir
  alignEnd?: boolean
  onClick: () => void
  traceId?: string
}

const ICON: Record<SortDir, string> = { asc: 'fa-arrow-up-short-wide', desc: 'fa-arrow-down-wide-short' }

/** Encabezado ordenable: muestra la dirección activa y, en reposo, un indicador tenue. */
export function SortHeaderButton({ label, dir, alignEnd, onClick, traceId }: SortHeaderButtonProps) {
  const next = dir === 'asc' ? 'descendente' : 'ascendente'
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Ordenar por ${label.toLowerCase()} (${next})`}
      className={cn(
        'group/sort inline-flex items-center gap-1.5 uppercase font-bold rounded-md -mx-1 px-1 py-0.5 transition-colors hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        alignEnd && 'flex-row-reverse',
        dir && 'text-brand dark:text-brand-300',
      )}
      {...(traceId ? t(traceId) : {})}
    >
      {label}
      <i
        aria-hidden="true"
        className={cn(
          'fa-solid text-[9px]',
          dir ? ICON[dir] : 'fa-sort opacity-30 group-hover/sort:opacity-70',
        )}
      />
    </button>
  )
}
