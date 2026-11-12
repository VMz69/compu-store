import { Link } from 'react-router-dom'
import { ExploreMenu } from './ExploreMenu'
import { MobileMenu } from '@/34-pipeline-menu-movil/00-director-menu-movil'
import { navOffersPill, navQuickLink } from '@/34-pipeline-menu-movil/00-director-menu-movil'
import { INFO_LINKS } from '../../nav.config'
import { useNavbar } from '../../hooks/useNavbar'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/navbar/Navbar.tsx'

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
                      className={navQuickLink(isActive)}
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

            <span aria-hidden="true" className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            <Link
              to="/offers"
              aria-current={isOffersActive ? 'page' : undefined}
              className={navOffersPill(isOffersActive)}
              {...uiMeta({ id: 'layout.navbar.link.offers', component: 'Navbar', source: SOURCE })}
            >
              <i className="fa-solid fa-fire text-xs" />
              <span>Ofertas</span>
            </Link>
          </div>

          <ul aria-label="Información de la tienda" className="flex shrink-0 items-center">
            {INFO_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={pathname === link.to ? 'page' : undefined}
                  className={navQuickLink(pathname === link.to)}
                  {...uiMeta({ id: link.traceId, component: 'Navbar', source: SOURCE })}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

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
