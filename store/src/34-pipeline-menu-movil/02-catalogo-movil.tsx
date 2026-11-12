import { Link } from 'react-router-dom'
import { MOBILE_SECTION_TITLE } from './01-navegacion.styles'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { BrandWithCount, CategoryWithCount } from '@/00-director-modelos'

const SOURCE = 'src/34-pipeline-menu-movil/02-catalogo-movil.tsx'

const tileClass = (active: boolean) =>
  `flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors active:scale-[0.99] ${
    active
      ? 'bg-brand-50 text-brand dark:bg-brand-950/60'
      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700'
  }`

interface SectionHeaderProps {
  id: string
  title: string
  to: string
  traceId: string
  onNavigate: () => void
}

const SectionHeader = ({ id, title, to, traceId, onNavigate }: SectionHeaderProps) => (
  <div className="flex items-center justify-between">
    <h2 id={id} className={MOBILE_SECTION_TITLE}>{title}</h2>
    <Link
      to={to}
      onClick={onNavigate}
      className="px-1 text-xs font-bold text-brand"
      {...uiMeta({ id: traceId, component: 'MobileMenuCatalog', source: SOURCE })}
    >
      Ver todas
    </Link>
  </div>
)

interface MobileMenuCatalogProps {
  categories: CategoryWithCount[]
  brands: BrandWithCount[]
  pathname: string
  onNavigate: () => void
}

export const MobileMenuCatalog = ({ categories, brands, pathname, onNavigate }: MobileMenuCatalogProps) => (
  <>
    <section aria-labelledby="mobile-menu-categories" className="space-y-2.5">
      <SectionHeader id="mobile-menu-categories" title="Categorías" to="/categories" traceId="layout.mobile-menu.categories.all" onNavigate={onNavigate} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            onClick={onNavigate}
            aria-current={pathname === `/category/${category.slug}` ? 'page' : undefined}
            className={tileClass(pathname === `/category/${category.slug}`)}
            {...uiMeta({ id: `layout.mobile-menu.category.${category.slug}`, component: 'MobileMenuCatalog', source: SOURCE })}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-xs dark:bg-slate-900">
              <i className={`${category.icon} text-sm`} />
            </span>
            <span className="truncate">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>

    <section aria-labelledby="mobile-menu-brands" className="space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
      <SectionHeader id="mobile-menu-brands" title="Marcas" to="/brands" traceId="layout.mobile-menu.brands.all" onNavigate={onNavigate} />
      <div className="grid grid-cols-4 gap-2">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/brand/${brand.slug}`}
            onClick={onNavigate}
            aria-current={pathname === `/brand/${brand.slug}` ? 'page' : undefined}
            className={`${tileClass(pathname === `/brand/${brand.slug}`)} justify-center`}
            {...uiMeta({ id: `layout.mobile-menu.brand.${brand.slug}`, component: 'MobileMenuCatalog', source: SOURCE })}
          >
            <span className="truncate">{brand.name}</span>
          </Link>
        ))}
      </div>
    </section>
  </>
)
