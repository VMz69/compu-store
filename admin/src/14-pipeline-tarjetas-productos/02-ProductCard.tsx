import { clickable } from '@/83-pipeline-recursos-publicos/03-events'
import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../24-pipeline-inventario-productos/00-director-inventario-productos'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'
import { CardBody } from './04-CardBody'
import { CardFooter } from './05-CardFooter'
import { CardMedia } from './03-CardMedia'

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
