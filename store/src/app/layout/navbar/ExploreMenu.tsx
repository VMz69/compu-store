import { ExploreMenuPanel } from './ExploreMenuPanel'
import { uiMeta } from '@/ui-traceability'
import type { BrandWithCount, CategoryWithCount } from '@/shared/types'

const SOURCE = 'src/app/layout/navbar/ExploreMenu.tsx'

interface ExploreMenuProps {
  open: boolean
  active: boolean
  categories: CategoryWithCount[]
  brands: BrandWithCount[]
  pathname: string
  onToggle: () => void
}

export const ExploreMenu = ({ open, active, categories, brands, pathname, onToggle }: ExploreMenuProps) => (
  <div className="relative" {...uiMeta({ id: 'layout.navbar.explore', component: 'ExploreMenu', source: SOURCE })}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="explore-menu"
      className={`h-9 px-4 rounded-full text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        open
          ? 'bg-brand text-white'
          : 'bg-brand-50 dark:bg-brand-950/60 text-brand hover:bg-brand-100 dark:hover:bg-brand-900/60'
      } ${active && !open ? 'ring-1 ring-brand/40' : ''}`}
      {...uiMeta({ id: 'layout.navbar.explore.toggle', component: 'ExploreMenu', source: SOURCE })}
    >
      <i className="fa-solid fa-bars text-xs" />
      <span>Explorar</span>
      <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>

    {open ? <ExploreMenuPanel categories={categories} brands={brands} pathname={pathname} /> : null}
  </div>
)
