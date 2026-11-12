import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/grid/ProductCardInfo.tsx'

export const ProductCardInfo = ({ product }: { product: Product }) => {
  const traceId = `producto.card.${product.id}`

  return (
    <div
      className="mt-2.5 sm:mt-3.5 space-y-1"
      {...uiMeta({
        id: `${traceId}.info`,
        component: 'ProductCardInfo',
        source: SOURCE,
      })}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full">
          {product.brand}
        </span>
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {product.category}
        </span>
      </div>

      <Link
        to={`/product/${product.id}`}
        className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors line-clamp-2 leading-snug"
        title={product.name}
        {...uiMeta({
          id: `${traceId}.titulo`,
          component: 'ProductCardInfo',
          source: SOURCE,
        })}
      >
        {product.name}
      </Link>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:line-clamp-2 leading-relaxed">
        {product.description}
      </p>
    </div>
  )
}
