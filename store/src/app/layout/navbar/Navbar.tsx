import { Link } from 'react-router-dom'
import { ExploreMenu } from './ExploreMenu'
import { MobileMenu } from './MobileMenu'
import { useNavbar } from '../../hooks/useNavbar'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/app/layout/navbar/Navbar.tsx'

/** Enlace de texto: la página activa se marca con un subrayado de marca, sin relleno. */
const quickLink = (active: boolean) =>
  `relative h-12 px-3 inline-flex items-center text-sm transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
    active
      ? 'text-brand font-bold after:bg-brand'
      : 'text-slate-600 dark:text-slate-300 font-medium hover:text-brand after:bg-transparent hover:after:bg-brand-200 dark:hover:after:bg-brand-800'
  }`

export const Navbar = () => {
  const {
    navRef,
    pathname,
    categories,
    brands,
    isExploreMenuOpen,
    isMobileMenuOpen,
    isCatalogActive,
    isOffersActive,
    toggleExploreMenu,
    closeOverlays,
  } = useNavbar()

  return (
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      className="relative lg:border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
      {...uiMeta({ id: 'layout.navbar', component: 'Navbar', source: SOURCE })}
    >
      <div className="max-w-app mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10">
        <div className="hidden lg:flex items-center justify-between gap-6 h-12">
          <div className="flex items-center gap-4 min-w-0">
            <ExploreMenu
              open={isExploreMenuOpen}
              active={isCatalogActive}
              categories={categories}
              brands={brands}
              pathname={pathname}
              onToggle={toggleExploreMenu}
            />

            <span aria-hidden="true" className="hidden xl:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

            <ul className="hidden xl:flex items-center">
              {categories.map((category) => {
                const isActive = pathname === `/category/${category.slug}`
                return (
                  <li key={category.id}>
                    <Link
                      to={`/category/${category.slug}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={quickLink(isActive)}
                      {...uiMeta({
                        id: `layout.navbar.link.category.${category.slug}`,
                        component: 'Navbar',
                        source: SOURCE,
                      })}
                    >
                      {category.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <Link
            to="/offers"
            aria-current={isOffersActive ? 'page' : undefined}
            className={`h-9 px-4 rounded-full text-sm font-bold flex shrink-0 items-center gap-2 transition-colors ${
              isOffersActive
                ? 'bg-amber-500 text-white'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/90 dark:border-amber-800/60'
            }`}
            {...uiMeta({ id: 'layout.navbar.link.offers', component: 'Navbar', source: SOURCE })}
          >
            <i className="fa-solid fa-fire text-xs" />
            <span>Ofertas</span>
          </Link>
        </div>

        <MobileMenu
          open={isMobileMenuOpen}
          categories={categories}
          brands={brands}
          pathname={pathname}
          onNavigate={closeOverlays}
        />
      </div>
    </nav>
  )
}
