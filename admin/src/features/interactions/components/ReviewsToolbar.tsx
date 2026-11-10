import { cn } from '@/shared/lib/cn'
import { Button, SearchInput, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ReviewFilter, ReviewModerationApi } from '../hooks/useReviewModeration'

const t = tracer('ReviewsToolbar', 'src/features/interactions/components/ReviewsToolbar.tsx')

const RATING_OPTIONS = [{ value: '', label: 'Todas las estrellas' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` }))]

/** Filtros: estado (con conteo), estrellas y búsqueda + aprobación en lote de lo visible. */
export function ReviewsToolbar({ api }: { api: ReviewModerationApi }) {
  const m = api.metrics
  const tabs: { id: ReviewFilter; label: string; count: number }[] = [
    { id: 'pendiente', label: 'Pendientes', count: m.pending },
    { id: 'aprobado', label: 'Publicados', count: m.published },
    { id: 'rechazado', label: 'Rechazados', count: m.rejected },
    { id: 'all', label: 'Todos', count: api.total },
  ]

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3" {...t('interactions.toolbar')}>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 w-fit" role="tablist" aria-label="Filtrar por estado">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={api.status === tab.id}
            onClick={() => api.setStatus(tab.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', api.status === tab.id ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}
            {...t(`interactions.tab.${tab.id}`)}
          >
            {tab.label}
            <span className={cn('ml-1.5 text-[10px] px-1.5 rounded-md tabular-nums', tab.id === 'pendiente' && tab.count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'opacity-70')}>{tab.count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput wrapperClassName="w-full sm:w-64" placeholder="Producto, cliente o texto…" aria-label="Buscar comentarios" value={api.search} onChange={api.onSearch} {...t('interactions.search')} />
        <Select tone="filter" options={RATING_OPTIONS} value={api.rating === null ? '' : String(api.rating)} onChange={(e) => api.setRating(e.target.value ? Number(e.target.value) : null)} aria-label="Filtrar por estrellas" {...t('interactions.rating')} />
        {api.canModerate && api.approveAllVisible && (
          <Button variant="soft" icon="fa-solid fa-check-double" onClick={api.approveAllVisible} {...t('interactions.approve-all')}>
            Aprobar {api.pendingVisibleCount} visibles
          </Button>
        )}
      </div>
    </div>
  )
}
