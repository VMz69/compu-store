import { cn } from '@/shared/lib/cn'
import { tracer } from '@/00-trazabilidad'

const t = tracer('SegmentedTabs', 'src/shared/ui/SegmentedTabs.tsx')

export interface SegmentedTabItem<T extends string> {
  id: T
  label: string
  /** Conteo opcional (etiqueta pequeña a la derecha). */
  count?: number
  /** Clase FontAwesome completa (opcional). */
  icon?: string
  /** Resalta el conteo (ej. pendientes por atender). */
  alert?: boolean
}

interface SegmentedTabsProps<T extends string> {
  items: SegmentedTabItem<T>[]
  value: T
  onChange: (id: T) => void
  'aria-label': string
  /** Prefijo de trazabilidad: cada pestaña recibe `${traceId}.${id}`. */
  traceId: string
  className?: string
}

/**
 * Filtro segmentado del sistema (pastilla gris, opción activa en blanco).
 * Mismo patrón que Ofertas, Comentarios y Categorías; se desplaza en horizontal si no cabe.
 */
export function SegmentedTabs<T extends string>({ items, value, onChange, traceId, className, ...rest }: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-full overflow-x-auto hide-scrollbar', className)}
      {...rest}
      {...t(traceId)}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all',
              active ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            )}
            {...t(`${traceId}.${item.id}`)}
          >
            {item.icon && <i className={cn(item.icon, 'text-[10px]')} aria-hidden="true" />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 rounded-md tabular-nums',
                  item.alert && item.count ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : active ? 'bg-brand/10' : 'bg-slate-200/70 dark:bg-slate-700',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
