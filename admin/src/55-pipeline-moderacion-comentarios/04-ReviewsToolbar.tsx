import { Button, ListToolbar, LiveSearch, SegmentedTabs, Select, type SegmentedTabItem } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ReviewFilter, ReviewModerationApi } from './02-useReviewModeration'

const t = tracer('ReviewsToolbar', 'src/55-pipeline-moderacion-comentarios/04-ReviewsToolbar.tsx')

const RATING_OPTIONS = [{ value: '', label: 'Todas las estrellas' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` }))]

/** Barra estándar de listados: estados · buscador · estrellas ··· aprobación en lote. */
export function ReviewsToolbar({ api }: { api: ReviewModerationApi }) {
  const m = api.metrics
  const tabs: SegmentedTabItem<ReviewFilter>[] = [
    { id: 'pendiente', label: 'Pendientes', count: m.pending, alert: true },
    { id: 'aprobado', label: 'Publicados', count: m.published },
    { id: 'rechazado', label: 'Rechazados', count: m.rejected },
    { id: 'all', label: 'Todos', count: api.total },
  ]

  return (
    <ListToolbar
      traceId="interactions.toolbar"
      context={['Comentarios', api.areaLabel]}
      tabs={<SegmentedTabs items={tabs} value={api.status} onChange={api.setStatus} aria-label="Filtrar por estado" traceId="interactions.tab" />}
      search={<LiveSearch value={api.search} onChange={api.onSearch} onClear={api.clearSearch} resultCount={api.items.length} placeholder="Producto, cliente o texto…" aria-label="Buscar comentarios" {...t('interactions.search')} />}
      filters={<Select tone="filter" options={RATING_OPTIONS} value={api.rating === null ? '' : String(api.rating)} onChange={(e) => api.setRating(e.target.value ? Number(e.target.value) : null)} aria-label="Filtrar por estrellas" {...t('interactions.rating')} />}
      action={
        api.canModerate && api.approveAllVisible && (
          <Button variant="soft" icon="fa-solid fa-check-double" onClick={api.approveAllVisible} {...t('interactions.approve-all')}>
            Aprobar {api.pendingVisibleCount} visibles
          </Button>
        )
      }
    />
  )
}
