import { Link } from 'react-router-dom'
import { uiMeta } from '@/ui-traceability'
import type { CategoryWithCount } from '@/shared/types'

const SOURCE = 'src/app/layout/navbar/MobileMenu.tsx'

interface MobileMenuProps {
  open: boolean
  categories: CategoryWithCount[]
  pathname: string
  onNavigate: () => void
}

const sectionTitle =
  'px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500'

const infoLinkClass = (active: boolean) =>
  `flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
    active
      ? 'bg-brand-50 text-brand dark:bg-brand-950/60'
      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700'
  }`

export const MobileMenu = ({ open, categories, pathname, onNavigate }: MobileMenuProps) => {
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
        <section aria-labelledby="mobile-menu-categories" className="space-y-2.5">
          <h2 id="mobile-menu-categories" className={sectionTitle}>
            Categorías
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={onNavigate}
                aria-current={pathname === `/category/${category.slug}` ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors active:scale-[0.99] ${
                  pathname === `/category/${category.slug}`
                    ? 'bg-brand-50 text-brand dark:bg-brand-950/60'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700'
                }`}
                {...uiMeta({
                  id: `layout.mobile-menu.category.${category.slug}`,
                  component: 'MobileMenu',
                  source: SOURCE,
                })}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-xs dark:bg-slate-900">
                  <i className={`${category.icon} text-sm`} />
                </span>
                <span className="truncate">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="mobile-menu-info"
          className="space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <h2 id="mobile-menu-info" className={sectionTitle}>
            Información
          </h2>
          <div className="space-y-1.5">
            <Link
              to="/about"
              onClick={onNavigate}
              aria-current={pathname === '/about' ? 'page' : undefined}
              className={infoLinkClass(pathname === '/about')}
              {...uiMeta({
                id: 'layout.mobile-menu.about',
                component: 'MobileMenu',
                source: SOURCE,
              })}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <i className="fa-solid fa-circle-info" />
              </span>
              <span className="flex-1">Nosotros</span>
              <i className="fa-solid fa-chevron-right text-[10px] text-slate-400" />
            </Link>
            <Link
              to="/contact"
              onClick={onNavigate}
              aria-current={pathname === '/contact' ? 'page' : undefined}
              className={infoLinkClass(pathname === '/contact')}
              {...uiMeta({
                id: 'layout.mobile-menu.contact',
                component: 'MobileMenu',
                source: SOURCE,
              })}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <i className="fa-solid fa-envelope" />
              </span>
              <span className="flex-1">Contacto</span>
              <i className="fa-solid fa-chevron-right text-[10px] text-slate-400" />
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="mobile-menu-offers"
          className="border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <h2 id="mobile-menu-offers" className={`${sectionTitle} mb-2.5`}>
            Ofertas
          </h2>
          <Link
            to="/offers"
            onClick={onNavigate}
            aria-current={pathname === '/offers' ? 'page' : undefined}
            className="flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3.5 text-amber-950 shadow-sm transition-transform active:scale-[0.99]"
            {...uiMeta({
              id: 'layout.mobile-menu.offers',
              component: 'MobileMenu',
              source: SOURCE,
            })}
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
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
              Hot
            </span>
          </Link>
        </section>
      </div>
    </div>
  )
}
