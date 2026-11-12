import { Link } from 'react-router-dom'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/cart/components/CartWidget.tsx'

interface CartWidgetProps {
  count: number
  subtotal: number
  active: boolean
}

export const CartWidget = ({ count, subtotal, active }: CartWidgetProps) => (
  <Link
    to="/cart"
    title="Ver carrito de compras"
    aria-label={`Ver carrito de compras (${count} productos)`}
    className={`text-slate-700 dark:text-slate-200 hover:text-brand transition-colors flex items-center gap-2.5 p-0.5 sm:px-3 sm:py-2 rounded-xl group hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none cursor-pointer ${
      active ? 'bg-brand-50 dark:bg-brand-950/60 text-brand' : ''
    }`}
    {...uiMeta({ id: 'layout.cart.widget', component: 'CartWidget', source: SOURCE })}
  >
    <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-light text-brand transition-all group-hover:bg-brand group-hover:text-white dark:bg-slate-800">
      <i className="fa-solid fa-cart-shopping text-base sm:text-lg" />
      <span
        aria-hidden="true"
        className={`${count > 0 ? 'badge-pulse' : ''} absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 rounded-full border-2 border-white dark:border-slate-900 min-w-[20px] text-center`}
      >
        {count}
      </span>
    </div>
    <div className="hidden sm:flex flex-col text-left leading-tight">
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mi Carrito</span>
      <span className="text-xs font-black text-brand-dark dark:text-brand-300">
        {formatCurrency(subtotal)}
      </span>
    </div>
  </Link>
)
