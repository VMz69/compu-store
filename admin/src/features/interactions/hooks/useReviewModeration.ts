import { useMemo, useState } from 'react'
import { ensurePermission, usePermission, useSession } from '@/00-director-acceso'
import { askConfirm } from '@/shared/store/confirm.store'
import { toast } from '@/shared/store/toast.store'
import { filterReviews, REJECT_REASONS, reviewMetrics, spamSignals } from '../lib/reviews.service'
import { useReviewsStore } from '../store'
import type { ProductReview, ReviewStatus } from '../types'

export type ReviewFilter = 'all' | ReviewStatus

const STATUS_TITLES: Record<ReviewFilter, string> = { pendiente: 'Pendientes', aprobado: 'Publicados', rechazado: 'Rechazados', all: 'Todos' }

/** Vista /interacciones: moderación de comentarios de productos del Front Office. */
export function useReviewModeration() {
  const { user } = useSession()
  const reviews = useReviewsStore((s) => s.reviews)
  const approve = useReviewsStore((s) => s.approve)
  const reject = useReviewsStore((s) => s.reject)
  const removeReview = useReviewsStore((s) => s.remove)
  const canModerate = usePermission('canModerateReviews')
  const canDelete = usePermission('canModerateReviews')
  const [status, setStatus] = useState<ReviewFilter>('pendiente')
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const by = user?.name ?? 'Equipo CompuStore'

  const items = useMemo(
    () => filterReviews(reviews, { status, search, rating }).map((review) => ({ review, signals: spamSignals(review) })),
    [reviews, status, search, rating],
  )
  const pendingVisible = items.filter((i) => i.review.status === 'pendiente').map((i) => i.review.id)

  const doApprove = (ids: string[]) => {
    if (!ensurePermission('canModerateReviews', 'No tienes permiso para moderar comentarios')) return
    approve(ids, by)
    toast(ids.length === 1 ? 'Comentario publicado en el Front Office' : `${ids.length} comentarios publicados`, 'success')
  }

  return {
    items,
    /** Área activa para la línea de ubicación de la barra (Comentarios › Pendientes). */
    areaLabel: STATUS_TITLES[status],
    metrics: reviewMetrics(reviews),
    total: reviews.length,
    status,
    setStatus,
    search,
    onSearch: (event: { target: { value: string } }) => setSearch(event.target.value),
    clearSearch: () => setSearch(''),
    rating,
    setRating,
    canModerate,
    canDelete,
    approve: (review: ProductReview) => doApprove([review.id]),
    /** Aprueba de una vez los pendientes que se están viendo (respeta filtros). */
    approveAllVisible: pendingVisible.length > 1 ? () => askConfirm({
      title: `Publicar ${pendingVisible.length} comentarios`,
      message: 'Se publicarán en el Front Office todos los comentarios pendientes que estás viendo. Revisa antes los marcados como posible spam.',
      confirmText: 'Publicar todos',
      onConfirm: () => doApprove(pendingVisible),
    }) : null,
    pendingVisibleCount: pendingVisible.length,
    reject: (review: ProductReview) =>
      askConfirm({
        title: 'Rechazar comentario',
        message: `El comentario de ${review.author} no se mostrará en el Front Office. El motivo es interno: el cliente no lo ve.`,
        confirmText: 'Rechazar',
        reason: { label: 'Motivo', placeholder: `Ej. ${REJECT_REASONS.join(', ')}`, minLength: 3 },
        onConfirm: (reason) => {
          if (!ensurePermission('canModerateReviews', 'No tienes permiso para moderar comentarios')) return
          reject(review.id, by, reason)
          toast('Comentario rechazado: no se publica', 'info')
        },
      }),
    remove: (review: ProductReview) =>
      askConfirm({
        title: 'Eliminar comentario',
        message: `Se eliminará definitivamente el comentario de ${review.author}${review.status === 'aprobado' ? ' y dejará de mostrarse en el Front Office' : ''}. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        onConfirm: () => {
          if (!ensurePermission('canModerateReviews', 'No tienes permiso para eliminar comentarios')) return
          removeReview(review.id)
          toast('Comentario eliminado', 'info')
        },
      }),
  }
}

export type ReviewModerationApi = ReturnType<typeof useReviewModeration>
