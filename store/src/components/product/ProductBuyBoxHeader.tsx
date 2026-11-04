import { RatingStars } from '@/components/ui/RatingStars'
import { formatSku } from '@/services/formatters'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/ProductBuyBoxHeader.tsx'

interface ProductBuyBoxHeaderProps {
  product: Product
  reviewsCount: number
  onShowReviews: () => void
}

export const ProductBuyBoxHeader = ({
  product,
  reviewsCount,
  onShowReviews,
}: ProductBuyBoxHeaderProps) => {
  const traceId = `producto.detalle.${product.id}`

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-100 dark:border-brand-800">
          {product.brand}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
          {product.category}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 ml-auto">
          SKU: {formatSku(product.id)}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-snug">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
        <RatingStars rating={product.rating} />
        <button
          type="button"
          onClick={onShowReviews}
          className="text-brand font-bold hover:underline cursor-pointer"
          {...uiMeta({
            id: `${traceId}.ver-opiniones`,
            component: 'ProductBuyBoxHeader',
            source: SOURCE,
          })}
        >
          {product.rating} ({reviewsCount} opiniones de compradores)
        </button>
        <span>•</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          <i className="fa-solid fa-circle-check text-emerald-500 mr-1" />
          Producto Verificado
        </span>
      </div>
    </div>
  )
}
