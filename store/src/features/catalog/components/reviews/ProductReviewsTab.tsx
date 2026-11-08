import { RatingSummary } from './RatingSummary'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { useProductReviews } from '../../hooks/useProductReviews'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/catalog/components/reviews/ProductReviewsTab.tsx'

export const ProductReviewsTab = ({ product }: { product: Product }) => {
  const { reviews, distribution } = useProductReviews(product.id)

  return (
    <div
      className="space-y-6 sm:space-y-10 animate-fade-in"
      {...uiMeta({
        id: 'producto.tabs.reviews',
        component: 'ProductReviewsTab',
        source: SOURCE,
      })}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <RatingSummary
            rating={product.rating}
            reviewsCount={reviews.length}
            distribution={distribution}
          />
          <ReviewForm productId={product.id} />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Opiniones Verificadas de Clientes ({reviews.length})
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Más recientes primero</span>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
