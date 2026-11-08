import type { PaginationState } from '@/shared/hooks/usePagination'
import { cn } from '@/shared/lib/cn'
import { tracer } from '@/ui-traceability'

const t = tracer('Pagination', 'src/shared/ui/Pagination.tsx')

/** Botón base del paginador (clases completas; Tailwind v4 no genera clases concatenadas). */
const PAGE_BUTTON =
  'min-w-8 h-8 px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const PAGE_ACTIVE = 'bg-brand text-white shadow-2xs'
const PAGE_IDLE = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'

interface PaginationProps {
  /** Estado devuelto por `usePagination(...).pagination`. */
  pagination: PaginationState
  /**
   * Prefijo de trazabilidad del feature que lo usa (ej. "catalog", "sales").
   * Genera ids como `catalog.pagination.page.2`, consistentes con la convención
   * `feature.zona.elemento[.id]`.
   */
  idPrefix: string
  /** Sustantivo plural para el resumen: "Mostrando 1–8 de 12 {itemLabel}". */
  itemLabel?: string
}

/**
 * Paginador accesible construido solo con Tailwind (sin MUI).
 *
 * Es UI pura: no calcula nada. Todo (rango visible, botones con elipsis,
 * límites) llega resuelto desde `usePagination`.
 *
 * Accesibilidad: `<nav aria-label>`, `aria-current="page"` en la página activa
 * y `aria-label` en los botones de flecha.
 *
 * Responsive: en móvil se apila (resumen arriba, botones abajo); desde `sm`
 * se distribuye en una sola fila.
 */
export function Pagination({ pagination: p, idPrefix, itemLabel = 'registros' }: PaginationProps) {
  if (p.totalItems === 0) return null
  const id = (suffix: string) => t(`${idPrefix}.pagination${suffix}`)

  return (
    <nav
      aria-label="Paginación"
      className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
      {...id('')}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span aria-live="polite">
          Mostrando{' '}
          <b className="text-slate-700 dark:text-slate-200">
            {p.rangeStart}–{p.rangeEnd}
          </b>{' '}
          de <b className="text-slate-700 dark:text-slate-200">{p.totalItems}</b> {itemLabel}
        </span>
        <label className="flex items-center gap-1.5">
          <span>Por página:</span>
          <select
            value={p.pageSize}
            onChange={p.onPageSizeChange}
            className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand cursor-pointer"
            {...id('.page-size')}
          >
            {p.pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={!p.canPrev}
          className={cn(PAGE_BUTTON, PAGE_IDLE)}
          onClick={p.prev}
          {...id('.prev')}
        >
          <i className="fa-solid fa-chevron-left text-[10px]" aria-hidden="true" />
        </button>

        {p.pages.map((token) =>
          typeof token === 'number' ? (
            <button
              key={token}
              type="button"
              aria-label={`Página ${token}`}
              aria-current={token === p.page ? 'page' : undefined}
              className={cn(PAGE_BUTTON, token === p.page ? PAGE_ACTIVE : PAGE_IDLE)}
              onClick={() => p.goTo(token)}
              {...id(`.page.${token}`)}
            >
              {token}
            </button>
          ) : (
            <span key={token} className="min-w-8 h-8 flex items-center justify-center text-xs text-slate-400" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          aria-label="Página siguiente"
          disabled={!p.canNext}
          className={cn(PAGE_BUTTON, PAGE_IDLE)}
          onClick={p.next}
          {...id('.next')}
        >
          <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
