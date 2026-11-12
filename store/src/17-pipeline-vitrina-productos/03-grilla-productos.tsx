import type { ReactNode } from 'react'
import { ProductCard } from './02-tarjeta-producto'
import { EmptyState } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/17-pipeline-vitrina-productos/03-grilla-productos.tsx'

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
  gridClassName = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6',
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
