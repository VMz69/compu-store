import { Link } from 'react-router-dom'
import { uiMeta } from '@/ui-traceability'
import type { BrandWithCount } from '@/types'

const SOURCE = 'src/components/catalog/BrandCard.tsx'

export const BrandCard = ({ brand }: { brand: BrandWithCount }) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft-card dark:shadow-none hover:shadow-soft-hover transition-all flex flex-col justify-between group"
    {...uiMeta({
      id: `catalog.brand-card.${brand.slug}`,
      component: 'BrandCard',
      source: SOURCE,
    })}
  >
    <div className="space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand group-hover:bg-brand group-hover:text-white transition-colors flex items-center justify-center text-2xl">
        <i className={brand.icon} />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors">
          {brand.name}
        </h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {brand.count} productos
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {brand.description}
      </p>
    </div>
    <Link
      to={`/brand/${brand.slug}`}
      className="mt-6 w-full py-2.5 px-4 rounded-xl border border-brand text-brand hover:bg-brand hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
      {...uiMeta({
        id: `catalog.brand-card.${brand.slug}.cta`,
        component: 'BrandCard',
        source: SOURCE,
      })}
    >
      <span>Ver catálogo {brand.name}</span>
      <i className="fa-solid fa-arrow-right text-[10px]" />
    </Link>
  </div>
)
