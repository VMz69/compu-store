import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'
import { useSearchResultItem } from '../hooks/useSearchResultItem'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/search/components/SearchResultItem.tsx'

interface SearchResultItemProps {
  product: Product
  onSelect: (product: Product) => void
  onAddToCart: (product: Product) => void
}

/**
 * Fila del desplegable de búsqueda. Clic en la fila navega al detalle; el botón
 * de carrito detiene la propagación para no disparar la navegación.
 */
export const SearchResultItem = ({ product, onSelect, onAddToCart }: SearchResultItemProps) => {
  const { isOffer, discount, inCart, canAdd } = useSearchResultItem(product)
  const trace = (id: string) => uiMeta({ id, component: 'SearchResultItem', source: SOURCE })

  return (
    <li role="option" className="group" {...trace(`layout.search.result.${product.id}`)}>
      <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70">
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          {...trace(`layout.search.result.${product.id}.link`)}
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
          disabled={!canAdd}
          title="Agregar al carrito"
          aria-label={`Agregar ${product.name} al carrito`}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs transition-all hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          {...trace(`layout.search.result.${product.id}.add`)}
        >
          <i className="fa-solid fa-cart-plus text-xs" />
          {inCart ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          ) : null}
        </button>
      </div>
    </li>
  )
}
