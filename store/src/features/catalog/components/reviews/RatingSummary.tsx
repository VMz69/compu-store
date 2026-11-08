import { RatingStars } from '@/components/ui/RatingStars'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/product/RatingSummary.tsx'

interface DistributionItem {
  stars: number
  count: number
  percent: number
}

interface RatingSummaryProps {
  rating: number
  reviewsCount: number
  distribution: DistributionItem[]
}

export const RatingSummary = ({
  rating,
  reviewsCount,
  distribution,
}: RatingSummaryProps) => (
  <div
    className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center space-y-3"
    {...uiMeta({
      id: 'producto.reviews.summary',
      component: 'RatingSummary',
      source: SOURCE,
    })}
  >
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
      Calificación General
    </span>
    <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100">
      {rating}
    </div>
    <div className="flex justify-center">
      <RatingStars rating={rating} className="text-base gap-1" traceId="producto.reviews.rating" />
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
      Basado en <b>{reviewsCount} opiniones</b> de clientes en El Salvador
    </p>

    <div className="space-y-1.5 pt-2 text-[11px] text-slate-600 dark:text-slate-300 text-left">
      {distribution.map((item) => (
        <div key={item.stars} className="flex items-center gap-2">
          <span className="w-8 font-bold">{item.stars} ★</span>
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <span className="w-8 text-right text-slate-400 font-medium">{item.percent}%</span>
        </div>
      ))}
    </div>
  </div>
)
