import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/shared/ui/RatingStars.tsx'

interface RatingStarsProps {
  rating: number
  className?: string
  traceId?: string
}

const STARS = [1, 2, 3, 4, 5]

export const RatingStars = ({
  rating,
  className = 'text-xs',
  traceId = 'ui.rating',
}: RatingStarsProps) => (
  <span
    className={`inline-flex items-center gap-0.5 ${className}`}
    aria-label={`${rating} de 5 estrellas`}
    {...uiMeta({ id: traceId, component: 'RatingStars', source: SOURCE })}
  >
    {STARS.map((star) => (
      <i
        key={star}
        className={`fa-solid ${
          rating >= star
            ? 'fa-star text-amber-400'
            : rating >= star - 0.5
              ? 'fa-star-half-stroke text-amber-400'
              : 'fa-star text-slate-200 dark:text-slate-700'
        }`}
      />
    ))}
  </span>
)
