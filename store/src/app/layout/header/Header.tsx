import { Link, useNavigate } from 'react-router-dom'
import { CartWidget, useCart } from '@/features/cart'
import { Logo } from '@/shared/ui/Logo'
import { SearchInput, useSearchInput, useSearchSuggestions } from '@/features/search'
import { ThemeToggle } from './ThemeToggle'
import { useHeaderState } from '../../hooks/useHeaderState'
import { useMobileSearchCollapse } from '../../hooks/useMobileSearchCollapse'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/app/layout/header/Header.tsx'

export const Header = () => {
  const {
    pathname,
    cartCount,
    cartSubtotal,
    favoritesCount,
    isDark,
    toggleDarkMode,
    isMobileMenuOpen,
    toggleMobileMenu,
  } = useHeaderState()
  const search = useSearchInput()
  const suggestions = useSearchSuggestions()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const isMobileSearchCollapsed = useMobileSearchCollapse()

  return (
    <div
      className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10"
      {...uiMeta({ id: 'layout.header', component: 'Header', source: SOURCE })}
    >
      <div className="flex justify-between items-center h-16 md:h-20 gap-2 md:gap-4">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center select-none sm:flex-none"
          {...uiMeta({ id: 'layout.header.logo', component: 'Header', source: SOURCE })}
        >
          <Logo
            isDark={isDark}
            className="h-11 w-auto max-w-full object-left md:h-14"
          />
        </Link>

        <SearchInput
          variant="desktop"
          value={search.value}
          hasValue={search.hasValue}
          onChange={search.setValue}
          onSubmit={search.submit}
          onClear={search.clear}
          suggestions={suggestions.suggestions}
          onSelectSuggestion={(product) => navigate(`/product/${product.id}`)}
          onAddToCartSuggestion={(product) => addToCart(product, 1)}
        />

        <div className="flex shrink-0 items-center gap-1 min-[400px]:gap-2 sm:gap-4">
          <ThemeToggle
            isDark={isDark}
            onToggle={toggleDarkMode}
            compact
            traceId="layout.header.theme"
          />

          <Link
            to="/favorites"
            title="Ver mis productos favoritos"
            aria-label={`Ver mis productos favoritos (${favoritesCount})`}
            aria-current={pathname === '/favorites' ? 'page' : undefined}
            className={`text-slate-700 dark:text-slate-200 hover:text-brand transition-colors flex items-center justify-center relative group focus:outline-none cursor-pointer ${
              pathname === '/favorites' ? 'text-brand' : ''
            }`}
            {...uiMeta({
              id: 'layout.header.favorites',
              component: 'Header',
              source: SOURCE,
            })}
          >
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
              <i
                className={`${favoritesCount > 0 ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-xl sm:text-2xl transition-colors`}
              />
              <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-black px-1.5 rounded-full border-2 border-white dark:border-slate-900 min-w-[18px] text-center">
                {favoritesCount}
              </span>
            </div>
            <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-slate-700">
              Favoritos
            </span>
          </Link>

          <CartWidget
            count={cartCount}
            subtotal={cartSubtotal}
            active={pathname === '/cart'}
          />

          <button
            type="button"
            onClick={() => toggleMobileMenu()}
            title={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            data-overlay-toggle
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none lg:hidden min-[400px]:h-10 min-[400px]:w-10 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            {...uiMeta({
              id: 'layout.header.mobile-toggle',
              component: 'Header',
              source: SOURCE,
            })}
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} />
          </button>
        </div>
      </div>

      <SearchInput
        variant="mobile"
        value={search.value}
        hasValue={search.hasValue}
        onChange={search.setValue}
        onSubmit={search.submit}
        onClear={search.clear}
        collapsed={isMobileSearchCollapsed}
        suggestions={suggestions.suggestions}
        onSelectSuggestion={(product) => navigate(`/product/${product.id}`)}
        onAddToCartSuggestion={(product) => addToCart(product, 1)}
      />
    </div>
  )
}
