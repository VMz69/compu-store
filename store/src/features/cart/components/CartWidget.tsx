import { Link } from 'react-router-dom'
import { formatCurrency } from '@/shared/lib/formatters'
import { uiMeta } from '@/ui-traceability'

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
    className={`text-slate-700 dark:text-slate-200 hover:text-brand transition-colors flex items-center gap-2.5 p-1 min-[400px]:p-1.5 sm:px-3 sm:py-2 rounded-xl group hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none cursor-pointer ${
      active ? 'bg-brand-50 dark:bg-brand-950/60 text-brand' : ''
    }`}
    {...uiMeta({ id: 'layout.cart.widget', component: 'CartWidget', source: SOURCE })}
  >
    <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand transition-all group-hover:bg-brand group-hover:text-white min-[400px]:h-10 min-[400px]:w-10 dark:bg-slate-800">
      <i className="fa-solid fa-cart-shopping text-lg" />
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
