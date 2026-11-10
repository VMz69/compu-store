import { EmptyState, KpiCard, PageContainer, PageHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { ReviewCard } from '../components/ReviewCard'
import { ReviewsToolbar } from '../components/ReviewsToolbar'
import { useReviewModeration } from '../hooks/useReviewModeration'

const t = tracer('InteractionsPage', 'src/features/interactions/pages/InteractionsPage.tsx')

/**
 * /interacciones · Moderación de los comentarios que los clientes dejan en la ficha
 * de producto del Front Office: aprobar (se publica), rechazar (no se publica) o eliminar.
 */
export function InteractionsPage() {
  const api = useReviewModeration()
  const m = api.metrics

  return (
    <PageContainer {...t('interactions')}>
      <PageHeader title="Comentarios de productos" subtitle="Opiniones enviadas desde el Front Office. Solo los aprobados se publican en la ficha del producto." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" {...t('interactions.kpis')}>
        <KpiCard label="Por moderar" value={m.pending} hint={m.pending ? 'Requieren revisión' : 'Todo al día'} hintIcon="fa-solid fa-hourglass-half" hintTone={m.pending ? 'warning' : 'success'} icon="fa-solid fa-inbox" iconTone="warning" />
        <KpiCard label="Publicados" value={m.published} hint="Visibles para clientes" hintIcon="fa-solid fa-eye" hintTone="success" icon="fa-solid fa-circle-check" iconTone="success" />
        <KpiCard label="Rechazados" value={m.rejected} hint="No se muestran" hintIcon="fa-solid fa-eye-slash" hintTone="muted" icon="fa-solid fa-ban" iconTone="danger" />
        <KpiCard label="Calificación pública" value={m.avgRating === null ? '—' : `${m.avgRating.toFixed(1)} ★`} hint="Promedio de lo publicado" hintIcon="fa-solid fa-star" hintTone="brand" icon="fa-solid fa-star-half-stroke" iconTone="brand" />
      </div>

      <ReviewsToolbar api={api} />

      {api.items.length === 0 ? (
        <EmptyState
          icon={api.status === 'pendiente' && !api.search ? 'fa-solid fa-circle-check' : 'fa-solid fa-comments'}
          title={api.status === 'pendiente' && !api.search && api.rating === null ? 'No hay comentarios por moderar.' : 'Sin comentarios con estos filtros.'}
          {...t('interactions.empty')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" {...t('interactions.list')}>
          {api.items.map((item) => <ReviewCard key={item.review.id} item={item} api={api} />)}
        </div>
      )}
    </PageContainer>
  )
}
