import { clickable } from '@/shared/lib/events'
import { tracer } from '@/ui-traceability'
import type { ProductActions } from '../../hooks/useProductActions'
import type { Product } from '../../types'
import { CardBody } from './CardBody'
import { CardFooter } from './CardFooter'
import { CardMedia } from './CardMedia'

const t = tracer('ProductCard', 'src/features/catalog/components/grid/ProductCard.tsx')

interface ProductCardProps {
  product: Product
  actions: ProductActions
}

/** Tarjeta de producto: clic abre el detalle; los controles internos están aislados. */
export function ProductCard({ product, actions }: ProductCardProps) {
  return (
    <article
      {...clickable(() => actions.openDetail(product.id))}
      aria-label={`Ver detalle de ${product.name}`}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-soft-card hover:border-brand/40 transition-all flex flex-col overflow-hidden group focus-visible:outline-2 focus-visible:outline-brand"
      {...t(`catalog.card.${product.id}`)}
    >
      <CardMedia product={product} />
      <CardBody product={product} actions={actions} />
      <CardFooter product={product} actions={actions} />
    </article>
  )
}
