import { Link } from 'react-router-dom'
import { getLineTotal } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { CartItem as CartItemType } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'

const SOURCE = 'src/features/cart/components/CartItem.tsx'

interface CartItemProps {
  item: CartItemType
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export const CartItem = ({ item, onIncrement, onDecrement, onRemove }: CartItemProps) => {
  const traceId = `carrito.item.${item.product.id}`
  const lineTotal = getLineTotal(item)

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none flex flex-col sm:flex-row items-center gap-4"
      {...uiMeta({ id: traceId, component: 'CartItem', source: SOURCE })}
    >
      <img
        src={item.product.imageUrl}
        alt={item.product.name}
        className="w-20 h-20 object-contain rounded-xl bg-slate-50 dark:bg-slate-800/60 p-1 flex-shrink-0"
      />

      <div className="flex-1 min-w-0 text-center sm:text-left">
        <span className="text-[10px] uppercase font-bold text-brand">
          {item.product.category}
        </span>
        <Link
          to={`/product/${item.product.id}`}
          className="block text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-brand cursor-pointer truncate"
          {...uiMeta({
            id: `${traceId}.titulo`,
            component: 'CartItem',
            source: SOURCE,
          })}
        >
          {item.product.name}
        </Link>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Precio unitario: <b>{formatCurrency(item.product.price)}</b>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 h-9 px-1">
          <button
            type="button"
            onClick={onDecrement}
            title="Disminuir cantidad"
            aria-label={`Disminuir cantidad de ${item.product.name}`}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-brand cursor-pointer"
            {...uiMeta({
              id: `${traceId}.menos`,
              component: 'CartItem',
              source: SOURCE,
            })}
          >
            <i className="fa-solid fa-minus text-[10px]" />
          </button>
          <span className="w-7 text-center text-xs font-bold text-slate-800 dark:text-slate-100">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={item.quantity >= item.product.stock}
            title="Aumentar cantidad"
            aria-label={`Aumentar cantidad de ${item.product.name}`}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-brand cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            {...uiMeta({
              id: `${traceId}.mas`,
              component: 'CartItem',
              source: SOURCE,
            })}
          >
            <i className="fa-solid fa-plus text-[10px]" />
          </button>
        </div>

        <span className="text-base font-black text-brand-dark dark:text-sky-400 min-w-[80px] text-right">
          {formatCurrency(lineTotal)}
        </span>

        <button
          type="button"
          onClick={onRemove}
          title="Eliminar del carrito"
          aria-label={`Eliminar ${item.product.name} del carrito`}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
          {...uiMeta({
            id: `${traceId}.eliminar`,
            component: 'CartItem',
            source: SOURCE,
          })}
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
      </div>
    </div>
  )
}
