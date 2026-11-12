import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { BrandWithCount } from '@/00-director-modelos'

const SOURCE = 'src/12-pipeline-marcas/02-tarjeta-marca.tsx'

export const BrandCard = ({ brand }: { brand: BrandWithCount }) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft-card dark:shadow-none hover:shadow-soft-hover transition-all flex flex-col justify-between group"
    {...uiMeta({
      id: `catalog.brand-card.${brand.slug}`,
      component: 'BrandCard',
      source: SOURCE,
    })}
  >
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand group-hover:bg-brand group-hover:text-white transition-colors flex items-center justify-center text-xl sm:text-2xl">
          <i className={brand.icon} />
        </div>
        <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {brand.count} productos
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors">
        {brand.name}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
        {brand.description}
      </p>
    </div>
    <Link
      to={`/brand/${brand.slug}`}
      className="mt-4 sm:mt-6 w-full py-2.5 px-4 rounded-xl border border-brand text-brand hover:bg-brand hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
      {...uiMeta({
        id: `catalog.brand-card.${brand.slug}.cta`,
        component: 'BrandCard',
        source: SOURCE,
      })}
    >
      <span>
        Ver catálogo<span className="hidden sm:inline"> {brand.name}</span>
      </span>
      <i className="fa-solid fa-arrow-right text-[10px]" />
    </Link>
  </div>
)
