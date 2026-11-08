import { Link } from 'react-router-dom'
import { formatCurrency } from '@/services/formatters'
import { getAvailableStock } from '@/services/cart.service'
import { useCartStore } from '@/store/useCartStore'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/layout/SearchDropdown.tsx'

interface SearchDropdownProps {
  open: boolean
  query: string
  suggestions: Product[]
  onSelect: (product: Product) => void
  onAddToCart: (product: Product) => void
  onClose: () => void
}

/**
 * Desplegable global de búsqueda.
 *
 * Muestra las coincidencias más relevantes con imagen, marca, título, precio,
 * estado de oferta y un botón para añadir al carrito sin salir de la vista.
 * Cada fila navega al detalle al hacer clic; el botón de carrito detiene la
 * propagación para no disparar la navegación.
 */
export const SearchDropdown = ({
  open,
  query,
  suggestions,
  onSelect,
  onAddToCart,
  onClose,
}: SearchDropdownProps) => {
  const cartItems = useCartStore((state) => state.items)
  if (!open || !query.trim()) return null

  const hasResults = suggestions.length > 0

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-dropdown dark:border-slate-800 dark:bg-slate-900"
      {...uiMeta({ id: 'layout.search.dropdown', component: 'SearchDropdown', source: SOURCE })}
    >
      {hasResults ? (
        <ul className="max-h-80 overflow-y-auto py-1.5" role="listbox">
          {suggestions.map((product) => {
            const isOffer =
              Boolean(product.originalPrice) && product.originalPrice! > product.price
            const discount =
              isOffer && product.originalPrice
                ? Math.round(
                    ((product.originalPrice! - product.price) / product.originalPrice!) * 100,
                  )
                : 0
            const inCart = cartItems.some((item) => item.product.id === product.id)
            const availableStock = getAvailableStock(product, cartItems)

            return (
              <li
                key={product.id}
                role="option"
                className="group"
                {...uiMeta({
                  id: `layout.search.result.${product.id}`,
                  component: 'SearchDropdown',
                  source: SOURCE,
                })}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => onSelect(product)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    {...uiMeta({
                      id: `layout.search.result.${product.id}.link`,
                      component: 'SearchDropdown',
                      source: SOURCE,
                    })}
                  >
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                      />
                      {isOffer ? (
                        <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-amber-950 shadow-xs">
                          -{discount}%
                        </span>
                      ) : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {product.brand}
                      </span>
                      <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {product.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm font-black text-brand-dark dark:text-sky-400">
                          {formatCurrency(product.price)}
                        </span>
                        {isOffer ? (
                          <span className="text-[10px] font-semibold text-slate-400 line-through">
                            {formatCurrency(product.originalPrice!)}
                          </span>
                        ) : null}
                        {product.stock <= 0 ? (
                          <span className="text-[10px] font-bold text-red-500">Agotado</span>
                        ) : null}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddToCart(product)
                    }}
                    disabled={product.stock <= 0 || availableStock <= 0}
                    title="Agregar al carrito"
                    aria-label={`Agregar ${product.name} al carrito`}
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs transition-all hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    {...uiMeta({
                      id: `layout.search.result.${product.id}.add`,
                      component: 'SearchDropdown',
                      source: SOURCE,
                    })}
                  >
                    <i className="fa-solid fa-cart-plus text-xs" />
                    {inCart ? (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    ) : null}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <i className="fa-solid fa-magnifying-glass text-2xl text-slate-300 dark:text-slate-600" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sin coincidencias para “{query}”
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Prueba con otra marca, categoría o nombre de producto.
          </p>
        </div>
      )}

      {hasResults ? (
        <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
          <Link
            to="/search"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-brand transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/40"
            {...uiMeta({
              id: 'layout.search.dropdown.all',
              component: 'SearchDropdown',
              source: SOURCE,
            })}
          >
            Ver todos los resultados
            <i className="fa-solid fa-arrow-right text-[10px]" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}