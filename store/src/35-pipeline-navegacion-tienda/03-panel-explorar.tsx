import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { BrandWithCount, CategoryWithCount } from '@/00-director-modelos'

const SOURCE = 'src/35-pipeline-navegacion-tienda/03-panel-explorar.tsx'

const COLUMN_TITLE = 'text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500'
const SEE_ALL = 'text-[11px] font-bold text-brand hover:underline'

const itemClass = (active: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand font-bold'
      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-brand'
  }`

interface ExploreMenuPanelProps {
  categories: CategoryWithCount[]
  brands: BrandWithCount[]
  pathname: string
}

export const ExploreMenuPanel = ({ categories, brands, pathname }: ExploreMenuPanelProps) => (
  <div
    id="explore-menu"
    className="dropdown-menu absolute top-full left-0 mt-2 w-[min(40rem,calc(100vw-4rem))] grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
    {...uiMeta({ id: 'layout.navbar.explore.menu', component: 'ExploreMenuPanel', source: SOURCE })}
  >
    <section aria-labelledby="explore-categories" className="p-4 space-y-2">
      <div className="flex items-center justify-between px-3 pb-1">
        <h2 id="explore-categories" className={COLUMN_TITLE}>Categorías</h2>
        <Link to="/categories" className={SEE_ALL} {...uiMeta({ id: 'layout.navbar.categories.all', component: 'ExploreMenuPanel', source: SOURCE })}>
          Ver todas
        </Link>
      </div>
      <ul className="space-y-0.5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={`/category/${category.slug}`}
              aria-current={pathname === `/category/${category.slug}` ? 'page' : undefined}
              className={itemClass(pathname === `/category/${category.slug}`)}
              {...uiMeta({ id: `layout.navbar.categories.item.${category.slug}`, component: 'ExploreMenuPanel', source: SOURCE })}
            >
              <span className="w-8 h-8 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand flex items-center justify-center">
                <i className={`${category.icon} text-sm`} />
              </span>
              <span className="flex-1 font-semibold">{category.name}</span>
              <span className="text-[11px] font-semibold text-slate-400">{category.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>

    <section
      aria-labelledby="explore-brands"
      className="p-4 space-y-2 bg-slate-50/80 dark:bg-slate-950/40 border-l border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center justify-between px-3 pb-1">
        <h2 id="explore-brands" className={COLUMN_TITLE}>Marcas</h2>
        <Link to="/brands" className={SEE_ALL} {...uiMeta({ id: 'layout.navbar.brands.all', component: 'ExploreMenuPanel', source: SOURCE })}>
          Ver todas
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              to={`/brand/${brand.slug}`}
              aria-current={pathname === `/brand/${brand.slug}` ? 'page' : undefined}
              className={itemClass(pathname === `/brand/${brand.slug}`)}
              {...uiMeta({ id: `layout.navbar.brands.item.${brand.slug}`, component: 'ExploreMenuPanel', source: SOURCE })}
            >
              <i className={`${brand.icon} text-xs text-slate-400 w-4 text-center`} />
              <span className="font-semibold truncate">{brand.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  </div>
)
