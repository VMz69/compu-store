import { Link } from 'react-router-dom'
import { formatCurrency } from '@/shared/lib/formatters'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/catalog/components/grid/ProductCardActions.tsx'

interface ProductCardActionsProps {
  product: Product
  availableStock: number
  isOutOfStock: boolean
  onAddToCart: () => void
}

export const ProductCardActions = ({
  product,
  availableStock,
  isOutOfStock,
  onAddToCart,
}: ProductCardActionsProps) => {
  const traceId = `producto.card.${product.id}`

  return (
    <div
      className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3"
      {...uiMeta({
        id: `${traceId}.acciones`,
        component: 'ProductCardActions',
        source: SOURCE,
      })}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-base sm:text-lg font-black text-brand-dark dark:text-sky-400">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 line-through ml-1.5 font-bold">
              {formatCurrency(product.originalPrice)}
            </span>
          ) : null}
        </div>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          {isOutOfStock ? (
            <span className="text-red-500 font-bold">Agotado</span>
          ) : (
            `Stock: ${availableStock}`
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/product/${product.id}`}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand text-slate-700 dark:text-slate-200 hover:text-brand text-xs font-bold transition-all text-center"
          {...uiMeta({
            id: `${traceId}.ver-detalle`,
            component: 'ProductCardActions',
            source: SOURCE,
          })}
        >
          Ver Detalle
        </Link>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock || availableStock <= 0}
          title="Agregar al carrito"
          aria-label={`Agregar ${product.name} al carrito`}
          className="p-2 w-9 h-9 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          {...uiMeta({
            id: `${traceId}.agregar`,
            component: 'ProductCardActions',
            source: SOURCE,
          })}
        >
          <i className="fa-solid fa-cart-plus" />
        </button>
      </div>
    </div>
  )
}
