import { Link } from 'react-router-dom'
import { uiMeta } from '@/ui-traceability'
import type { BrandWithCount } from '@/shared/types'

const SOURCE = 'src/app/layout/navbar/BrandMenu.tsx'

interface BrandMenuProps {
  open: boolean
  brands: BrandWithCount[]
  pathname: string
  onToggle: () => void
}

export const BrandMenu = ({ open, brands, pathname, onToggle }: BrandMenuProps) => {
  const isActive = pathname === '/brands' || pathname.startsWith('/brand/')

  return (
    <div
      className="relative w-full md:w-auto"
      {...uiMeta({ id: 'layout.navbar.brands', component: 'BrandMenu', source: SOURCE })}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full bg-slate-50 dark:bg-slate-800/90 hover:bg-brand-50/80 dark:hover:bg-brand-950/40 text-slate-800 dark:text-slate-100 hover:text-brand text-xs font-bold py-2 px-3 sm:px-3.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none ${
          isActive ? 'border-brand bg-brand-50 dark:bg-brand-950/60 text-brand ring-1 ring-brand/30' : ''
        }`}
        {...uiMeta({
          id: 'layout.navbar.brands.toggle',
          component: 'BrandMenu',
          source: SOURCE,
        })}
      >
        <i className="fa-solid fa-award text-xs text-brand" />
        <span>Marcas</span>
        <i
          className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform ${open ? 'rotate-180 text-brand' : ''}`}
        />
      </button>

      {open ? (
        <div
          className="dropdown-menu absolute top-full right-0 md:right-auto md:left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-slate-200 dark:border-slate-800 py-2.5 z-50"
          {...uiMeta({
            id: 'layout.navbar.brands.menu',
            component: 'BrandMenu',
            source: SOURCE,
          })}
        >
          <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Fabricantes
            </span>
            <Link
              to="/brands"
              className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
              {...uiMeta({
                id: 'layout.navbar.brands.all',
                component: 'BrandMenu',
                source: SOURCE,
              })}
            >
              Ver todas
            </Link>
          </div>
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brand/${brand.slug}`}
              className={`w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand flex items-center justify-between transition-colors cursor-pointer ${
                pathname === `/brand/${brand.slug}`
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand font-bold'
                  : ''
              }`}
              {...uiMeta({
                id: `layout.navbar.brands.item.${brand.slug}`,
                component: 'BrandMenu',
                source: SOURCE,
              })}
            >
              <span className="flex items-center gap-2.5">
                <i className={`${brand.icon} text-brand w-4 text-center`} />
                <span className="font-bold">{brand.name}</span>
              </span>
              <span className="text-[10px] px-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                {brand.count} items
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
