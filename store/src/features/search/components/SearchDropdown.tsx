import { Link } from 'react-router-dom'
import { uiMeta } from '@/ui-traceability'
import { SearchResultItem } from './SearchResultItem'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/search/components/SearchDropdown.tsx'

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
 * Muestra las coincidencias más relevantes (`SearchResultItem`) y un enlace a
 * la vista completa de resultados.
 */
export const SearchDropdown = ({
  open,
  query,
  suggestions,
  onSelect,
  onAddToCart,
  onClose,
}: SearchDropdownProps) => {
  if (!open || !query.trim()) return null

  const hasResults = suggestions.length > 0

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-dropdown dark:border-slate-800 dark:bg-slate-900"
      {...uiMeta({ id: 'layout.search.dropdown', component: 'SearchDropdown', source: SOURCE })}
    >
      {hasResults ? (
        <ul className="max-h-80 lg:max-h-[26rem] overflow-y-auto py-1.5" role="listbox">
          {suggestions.map((product) => (
            <SearchResultItem
              key={product.id}
              product={product}
              onSelect={onSelect}
              onAddToCart={onAddToCart}
            />
          ))}
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