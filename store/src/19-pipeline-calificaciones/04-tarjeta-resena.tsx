import { useHelpfulReview } from './01-valorar-resena'
import { RatingStars } from '@/19-pipeline-calificaciones/02-estrellas'
import { getInitials } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { Review } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/reviews/ReviewCard.tsx'

export const ReviewCard = ({ review }: { review: Review }) => {
  const { helpful, markHelpful } = useHelpfulReview()

  return (
    <div
      className="bg-slate-50/70 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2.5"
      {...uiMeta({
        id: `producto.reviews.card.${review.id}`,
        component: 'ReviewCard',
        source: SOURCE,
      })}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {getInitials(review.author)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {review.author}
              </span>
              {review.verified ? (
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <i className="fa-solid fa-circle-check text-[8px]" /> Compra Verificada
                </span>
              ) : null}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {review.city} • {review.date}
            </span>
          </div>
        </div>
        <RatingStars rating={review.rating} className="text-xs" traceId={`review.${review.id}.rating`} />
      </div>

      {review.title ? (
        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{review.title}</h5>
      ) : null}

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {review.comment}
      </p>

      <div className="pt-1 flex items-center gap-4 text-[10px] text-slate-400">
        <button
          type="button"
          onClick={markHelpful}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${helpful ? 'text-brand font-bold' : 'hover:text-brand'}`}
          {...uiMeta({
            id: `producto.reviews.card.${review.id}.helpful`,
            component: 'ReviewCard',
            source: SOURCE,
          })}
        >
          <i className={`${helpful ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`} />
          <span>Útil{helpful ? ' (1)' : ''}</span>
        </button>
      </div>
    </div>
  )
}
