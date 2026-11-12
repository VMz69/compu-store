import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { Badge } from '@/00-director-interfaz'
import type { ProductDetailApi } from '../../hooks/useProductDetail'
import { StockBadge } from '../StockBadge'
import { ReservedBadge } from '../ReservedBadge'
import { DetailGallery } from './DetailGallery'

type DetailSummaryProps = Pick<ProductDetailApi, 'product' | 'pricing' | 'gallery'>

/** Galería + resumen comercial: marca, rating, nombre, precios y estado web. */
export function DetailSummary({ product: p, pricing, gallery }: DetailSummaryProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <DetailGallery product={p} gallery={gallery} />

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand uppercase tracking-wider">{p.brand}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
            <i className="fa-solid fa-star text-[10px]" aria-hidden="true" />
            <span>{p.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">/ 5.0</span>
          </div>
        </div>

        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 leading-snug">{p.name}</h2>

        <div className="pt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-black text-brand">{formatCurrency(p.price)}</span>
          {pricing.hasDiscount && p.originalPrice && (
            <>
              <span className="text-xs text-slate-400 line-through">{formatCurrency(p.originalPrice)}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                Ahorro: -{formatCurrency(pricing.discountAmount)} ({pricing.discountPercent}%)
              </span>
            </>
          )}
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <StockBadge stock={p.stock} active={p.active} reorderPoint={p.reorderPoint} />
          <ReservedBadge productId={p.id} stock={p.stock} />
          <Badge
            tone={p.active ? 'brand' : 'neutral'}
            icon={p.active ? 'fa-solid fa-globe' : 'fa-solid fa-eye-slash'}
          >
            {p.active ? 'Publicado en Front Office' : 'No visible en Tienda Web'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
