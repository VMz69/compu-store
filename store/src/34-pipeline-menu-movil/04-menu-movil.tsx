import { Link } from 'react-router-dom'
import { MobileMenuCatalog } from './02-catalogo-movil'
import { MobileMenuInfo } from './03-informacion-movil'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { BrandWithCount, CategoryWithCount } from '@/00-director-modelos'

const SOURCE = 'src/34-pipeline-menu-movil/04-menu-movil.tsx'

interface MobileMenuProps {
  open: boolean
  categories: CategoryWithCount[]
  brands: BrandWithCount[]
  pathname: string
  onNavigate: () => void
}

/** Orden por prioridad comercial: ofertas → catálogo (categorías, marcas) → información. */
export const MobileMenu = ({ open, categories, brands, pathname, onNavigate }: MobileMenuProps) => {
  if (!open) return null

  return (
    <div
      id="mobile-menu"
      role="region"
      aria-label="Menú de navegación móvil"
      className="lg:hidden absolute inset-x-0 top-full z-50 border-t border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 shadow-xl animate-fade-in max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain"
      {...uiMeta({ id: 'layout.mobile-menu', component: 'MobileMenu', source: SOURCE })}
    >
      <div className="space-y-5">
        <Link
          to="/offers"
          onClick={onNavigate}
          aria-current={pathname === '/offers' ? 'page' : undefined}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 px-4 py-3.5 text-amber-950 shadow-sm transition-transform active:scale-[0.99]"
          {...uiMeta({ id: 'layout.mobile-menu.offers', component: 'MobileMenu', source: SOURCE })}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/40">
            <i className="fa-solid fa-fire text-lg" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-black">Ofertas Especiales</span>
            <span className="block text-[11px] font-semibold text-amber-900/80">
              Descuentos y promociones vigentes
            </span>
          </span>
          <i className="fa-solid fa-chevron-right text-xs text-amber-900/70" />
        </Link>

        <MobileMenuCatalog categories={categories} brands={brands} pathname={pathname} onNavigate={onNavigate} />

        <MobileMenuInfo pathname={pathname} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
