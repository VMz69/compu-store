import type { ReactNode } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/ProductGrid.tsx'

interface ProductGridProps {
  products: Product[]
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  traceId: string
  gridClassName?: string
}

export const ProductGrid = ({
  products,
  emptyIcon = 'fa-solid fa-box-open',
  emptyTitle = 'Sin productos disponibles',
  emptyDescription = 'Actualmente no hay artículos que coincidan con esta selección.',
  emptyAction,
  traceId,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
}: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        traceId={traceId}
      />
    )
  }

  return (
    <div
      className={gridClassName}
      {...uiMeta({ id: traceId, component: 'ProductGrid', source: SOURCE })}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
