import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { BrandWithCount } from '@/00-director-modelos'

const SOURCE = 'src/features/home/components/BrandTile.tsx'

export const BrandTile = ({ brand }: { brand: BrandWithCount }) => (
  <Link
    to={`/brand/${brand.slug}`}
    className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-brand shadow-xs hover:shadow-soft-hover transition-all flex flex-col items-center justify-center text-center group"
    {...uiMeta({
      id: `home.brand.${brand.slug}`,
      component: 'BrandTile',
      source: SOURCE,
    })}
  >
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center text-sm mb-1.5 transition-colors">
      <i className={brand.icon} />
    </div>
    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand">
      {brand.name}
    </span>
  </Link>
)
