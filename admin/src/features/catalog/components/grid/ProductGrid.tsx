import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../../hooks/useProductActions'
import type { Product } from '../../types'
import { ProductCard } from './ProductCard'

const t = tracer('ProductGrid', 'src/features/catalog/components/grid/ProductGrid.tsx')

interface ProductGridProps {
  items: Product[]
  actions: ProductActions
}

export function ProductGrid({ items, actions }: ProductGridProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
      {...t('catalog.grid')}
    >
      {items.map((product) => (
        <ProductCard key={product.id} product={product} actions={actions} />
      ))}
    </div>
  )
}
