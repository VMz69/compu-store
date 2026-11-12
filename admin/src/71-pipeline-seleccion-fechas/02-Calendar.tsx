import type { HTMLAttributes } from 'react'
import { useCalendar, WEEKDAYS, type CalendarOptions } from '@/71-pipeline-seleccion-fechas/03-useCalendar'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatLongISO } from '@/71-pipeline-seleccion-fechas/05-date'

interface CalendarProps extends CalendarOptions, Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Si se indica, resalta el periodo entre esta fecha y la seleccionada (ej. hoy → vencimiento). */
  rangeStart?: string
}

const NAV = 'w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand disabled:opacity-30 disabled:pointer-events-none transition-colors'

/** Calendario mensual propio (no el del navegador): tema claro/oscuro, límites y teclado. */
export function Calendar({ value, onSelect, min, max, rangeStart, className, ...rest }: CalendarProps) {
  const c = useCalendar({ value, onSelect, min, max })

  return (
    <div className={cn('w-full max-w-[300px] select-none', className)} {...rest}>
      <div className="flex items-center justify-between mb-2">
        <button type="button" className={NAV} onClick={c.prev} disabled={!c.canPrev} aria-label="Mes anterior">
          <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
        </button>
        <p className="text-sm font-black capitalize text-slate-800 dark:text-slate-100" aria-live="polite">{c.title}</p>
        <button type="button" className={NAV} onClick={c.next} disabled={!c.canNext} aria-label="Mes siguiente">
          <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">{d}</span>
        ))}
      </div>

      <div role="grid" aria-label={c.title} className="grid grid-cols-7 gap-y-1" onKeyDown={c.onKeyDown}>
        {c.days.map((d) => {
          const inRange = Boolean(rangeStart && value && d.iso >= rangeStart && d.iso <= value)
          return (
            <button
              key={d.iso}
              type="button"
              role="gridcell"
              tabIndex={d.isFocused ? 0 : -1}
              // Al navegar con teclado, el foco sigue al día enfocado.
              ref={d.isFocused ? (el) => {
                if (el?.parentElement?.contains(document.activeElement)) el.focus()
              } : undefined}
              aria-selected={d.isSelected}
              aria-disabled={d.isDisabled}
              aria-label={formatLongISO(d.iso)}
              onClick={() => c.select(d.iso)}
              onFocus={() => c.focus(d.iso)}
              className={cn(
                'h-9 text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
                inRange && !d.isSelected && 'bg-brand/10 dark:bg-brand/15 text-brand dark:text-brand-300',
                d.isSelected ? 'rounded-lg bg-brand text-white shadow-brand-glow' : inRange ? '' : 'rounded-lg',
                !d.isSelected && !inRange && (d.inMonth ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-600'),
                d.isToday && !d.isSelected && 'ring-1 ring-inset ring-brand/50',
                d.isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
              )}
            >
              {d.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
