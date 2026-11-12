import { ProductInfoActions } from './ProductInfoActions'
import { RatingStars } from '@/shared/ui/RatingStars'
import { formatCurrency, formatSku } from '@/shared/lib/formatters'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/detail/ProductInfo.tsx'

interface ProductInfoProps {
  product: Product
  categoryLabel: string
  reviewsCount: number
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  onShowReviews: () => void
}

export const ProductInfo = ({
  product,
  categoryLabel,
  reviewsCount,
  isFavorite,
  onToggleFavorite,
  onShare,
  onShowReviews,
}: ProductInfoProps) => {
  const traceId = `producto.detalle.${product.id}`

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5" {...uiMeta({ id: `${traceId}.info`, component: 'ProductInfo', source: SOURCE })}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-100 dark:border-brand-800">
            {product.brand}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
            {product.name}
          </h1>
          <ProductInfoActions
            productId={product.id}
            productName={product.name}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <RatingStars rating={product.rating} />
          <button
            type="button"
            onClick={onShowReviews}
            className="text-brand font-bold hover:underline cursor-pointer"
            {...uiMeta({ id: `${traceId}.ver-opiniones`, component: 'ProductInfo', source: SOURCE })}
          >
            {product.rating} ({reviewsCount} opiniones)
          </button>
          <span aria-hidden="true">•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
            <i className="fa-solid fa-circle-check text-emerald-500 mr-1" />
            Verificado
          </span>
          <span className="font-semibold text-slate-400">SKU: {formatSku(product.id)}</span>
        </div>
      </div>

      {/* Precio solo < lg: en desktop vive en ProductBuyBox (columna derecha). */}
      <div className="lg:hidden py-3 sm:py-4 border-y border-slate-100 dark:border-slate-800 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-sky-400">
          {formatCurrency(product.price)}
        </span>
        {product.originalPrice ? (
          <>
            <span className="text-sm text-slate-400 line-through font-bold">
              {formatCurrency(product.originalPrice)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <i className="fa-solid fa-tag text-[10px]" />
              Ahorras {formatCurrency(product.originalPrice - product.price)}
            </span>
          </>
        ) : null}
      </div>

      <div className="space-y-3 lg:pt-5 lg:border-t lg:border-slate-100 lg:dark:border-slate-800">
        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
          Acerca de este producto
        </h2>
        <ul className="space-y-2">
          {product.specs.map((spec) => (
            <li key={spec} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-snug">
              <i className="fa-solid fa-check text-emerald-500 text-[11px] mt-1" />
              <span>{spec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
