import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/date'
import { Badge, Button, Card, IconButton } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ReviewModerationApi } from '../hooks/useReviewModeration'
import { REVIEW_STATUS_META } from '../lib/reviews.service'
import { Stars } from './Stars'

const t = tracer('ReviewCard', 'src/features/interactions/components/ReviewCard.tsx')

type Item = ReviewModerationApi['items'][number]

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

/** Comentario tal como lo verá el cliente + contexto de moderación (producto, estado, señales) y acciones. */
export function ReviewCard({ item, api }: { item: Item; api: ReviewModerationApi }) {
  const { review: r, signals } = item
  const meta = REVIEW_STATUS_META[r.status]

  return (
    <Card className={cn('p-4 flex flex-col gap-3', r.status === 'pendiente' && 'border-amber-300/70 dark:border-amber-500/40')} {...t(`interactions.review.${r.id}`)}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="min-w-0 truncate text-slate-500 dark:text-slate-400">
          <i className="fa-solid fa-box mr-1.5 text-slate-400" aria-hidden="true" />
          <b className="text-slate-700 dark:text-slate-200">{r.productName}</b> <span className="font-mono text-slate-400">· {r.productId}</span>
        </span>
        <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
      </div>

      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-brand text-white text-xs font-black flex items-center justify-center shrink-0" aria-hidden="true">{initials(r.author)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{r.author}</p>
            <Stars rating={r.rating} className="text-xs shrink-0" />
          </div>
          <p className="text-[10px] text-slate-400">{r.city} · {formatDateTime(r.createdAt)}</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">{r.comment}</p>
        </div>
      </div>

      {signals.length > 0 && r.status === 'pendiente' && (
        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 flex flex-wrap gap-x-3">
          <span><i className="fa-solid fa-flag mr-1" aria-hidden="true" />Posible spam:</span>
          {signals.map((s) => <span key={s}>{s}</span>)}
        </p>
      )}
      {r.status !== 'pendiente' && r.moderatedBy && (
        <p className="text-[10px] text-slate-400">
          {r.status === 'aprobado' ? 'Publicado' : 'Rechazado'} por {r.moderatedBy} · {formatDateTime(r.moderatedAt)}
          {r.rejectReason && <span className="text-red-500 dark:text-red-400"> · Motivo: {r.rejectReason}</span>}
        </p>
      )}

      {(api.canModerate || api.canDelete) && (
        <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {api.canDelete && (
            <IconButton icon="fa-solid fa-trash-can" label="Eliminar comentario" tone="plain" sizeClass="w-8 h-8" className="mr-auto hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!" onClick={() => api.remove(r)} {...t(`interactions.review.delete.${r.id}`)} />
          )}
          {api.canModerate && r.status !== 'rechazado' && (
            <Button size="xs" variant="danger-soft" icon="fa-solid fa-ban" onClick={() => api.reject(r)} {...t(`interactions.review.reject.${r.id}`)}>
              {r.status === 'aprobado' ? 'Ocultar' : 'Rechazar'}
            </Button>
          )}
          {api.canModerate && r.status !== 'aprobado' && (
            <Button size="xs" icon="fa-solid fa-check" onClick={() => api.approve(r)} {...t(`interactions.review.approve.${r.id}`)}>
              {r.status === 'rechazado' ? 'Publicar de todos modos' : 'Aprobar y publicar'}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
