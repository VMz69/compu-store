import { isolate } from '@/shared/lib/events'
import { Button, IconButton } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../../hooks/useProductActions'
import type { Product } from '../../types'

const t = tracer('CardFooter', 'src/features/catalog/components/grid/CardFooter.tsx')

interface CardFooterProps {
  product: Product
  actions: ProductActions
}

/** Pie de la tarjeta: SKU y acciones de edición/eliminación según permisos. */
export function CardFooter({ product, actions }: CardFooterProps) {
  return (
    <div
      className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
      {...isolate}
      {...t(`catalog.card.footer.${product.id}`)}
    >
      <span className="text-[10px] font-mono font-bold text-slate-400">SKU: {product.sku}</span>
      <div className="flex items-center gap-2">
        {actions.permissions.canEdit && (
          <Button
            variant="tint"
            size="xs"
            icon="fa-solid fa-pen"
            title="Editar Producto"
            onClick={() => actions.openEdit(product)}
            {...t(`catalog.card.edit.${product.id}`)}
          >
            Editar
          </Button>
        )}
        {actions.permissions.canDelete && (
          <IconButton
            icon="fa-solid fa-trash"
            label="Eliminar Producto"
            tone="danger"
            sizeClass="w-7 h-7"
            iconClass="text-[10px]"
            onClick={() => actions.promptDelete(product)}
            {...t(`catalog.card.delete.${product.id}`)}
          />
        )}
      </div>
    </div>
  )
}
