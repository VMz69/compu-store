import { Link } from 'react-router-dom'
import { ProductGrid } from '@/components/product/ProductGrid'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/RelatedList.tsx'

interface RelatedListProps {
  products: Product[]
  categoryLabel: string
  categorySlug: string
}

export const RelatedList = ({
  products,
  categoryLabel,
  categorySlug,
}: RelatedListProps) => {
  if (products.length === 0) return null

  return (
    <div
      className="mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-5"
      {...uiMeta({
        id: 'producto.relacionados',
        component: 'RelatedList',
        source: SOURCE,
      })}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Sugerencias del Catálogo
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">
            Artículos complementarios de la misma categoría
          </h3>
        </div>
        <Link
          to={`/category/${categorySlug}`}
          className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 self-start sm:self-auto"
          {...uiMeta({
            id: 'producto.relacionados.ver-mas',
            component: 'RelatedList',
            source: SOURCE,
          })}
        >
          <span>Ver más en {categoryLabel}</span>
          <i className="fa-solid fa-arrow-right text-[10px]" />
        </Link>
      </div>

      <ProductGrid
        products={products}
        traceId="producto.relacionados.grid"
        gridClassName="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 opacity-95 hover:opacity-100 transition-opacity"
      />
    </div>
  )
}
