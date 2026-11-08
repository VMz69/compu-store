import { Link } from 'react-router-dom'
import { BrandMenu } from './BrandMenu'
import { CategoryMenu } from './CategoryMenu'
import { MobileMenu } from './MobileMenu'
import { useNavbar } from '../../hooks/useNavbar'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/app/layout/navbar/Navbar.tsx'

const navPill = (active: boolean) =>
  `px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
    active
      ? 'bg-brand text-white font-bold shadow-xs'
      : 'text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
  }`

export const Navbar = () => {
  const {
    navRef,
    pathname,
    categories,
    brands,
    isCategoryDropdownOpen,
    isBrandDropdownOpen,
    isMobileMenuOpen,
    toggleCategoryDropdown,
    toggleBrandDropdown,
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
        <div className="hidden lg:flex items-center justify-between py-1.5 md:py-1 min-h-[44px] md:h-13">
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:w-auto lg:items-center lg:space-x-2.5">
            <CategoryMenu
              open={isCategoryDropdownOpen}
              categories={categories}
              pathname={pathname}
              onToggle={() => toggleCategoryDropdown()}
            />
            <BrandMenu
              open={isBrandDropdownOpen}
              brands={brands}
              pathname={pathname}
              onToggle={() => toggleBrandDropdown()}
            />
          </div>

          <div className="hidden lg:flex items-center space-x-1 lg:space-x-1.5 text-xs font-medium">
            <Link
              to="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={navPill(pathname === '/')}
              {...uiMeta({
                id: 'layout.navbar.link.home',
                component: 'Navbar',
                source: SOURCE,
              })}
            >
              Inicio
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                aria-current={pathname === `/category/${category.slug}` ? 'page' : undefined}
                className={`hidden xl:inline-flex ${navPill(pathname === `/category/${category.slug}`)}`}
                {...uiMeta({
                  id: `layout.navbar.link.category.${category.slug}`,
                  component: 'Navbar',
                  source: SOURCE,
                })}
              >
                {category.name}
              </Link>
            ))}
            <Link
              to="/about"
              aria-current={pathname === '/about' ? 'page' : undefined}
              className={navPill(pathname === '/about')}
              {...uiMeta({
                id: 'layout.navbar.link.about',
                component: 'Navbar',
                source: SOURCE,
              })}
            >
              Nosotros
            </Link>
            <Link
              to="/contact"
              aria-current={pathname === '/contact' ? 'page' : undefined}
              className={navPill(pathname === '/contact')}
              {...uiMeta({
                id: 'layout.navbar.link.contact',
                component: 'Navbar',
                source: SOURCE,
              })}
            >
              Contacto
            </Link>
            <Link
              to="/offers"
              aria-current={pathname === '/offers' ? 'page' : undefined}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ml-1 lg:ml-2.5 cursor-pointer ${
                pathname === '/offers'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/90 dark:border-amber-800/60 font-semibold'
              }`}
              {...uiMeta({
                id: 'layout.navbar.link.offers',
                component: 'Navbar',
                source: SOURCE,
              })}
            >
              <span>Ofertas</span>
              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 rounded-full uppercase">
                Hot
              </span>
            </Link>
          </div>
        </div>

        <MobileMenu
          open={isMobileMenuOpen}
          categories={categories}
          pathname={pathname}
          onNavigate={closeOverlays}
        />
      </div>
    </nav>
  )
}
