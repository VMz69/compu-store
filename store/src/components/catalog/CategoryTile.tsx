import { Link } from 'react-router-dom'
import { uiMeta } from '@/ui-traceability'
import type { CategoryWithCount } from '@/types'

const SOURCE = 'src/components/catalog/CategoryTile.tsx'

export const CategoryTile = ({ category }: { category: CategoryWithCount }) => (
  <Link
    to={`/category/${category.slug}`}
    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand shadow-soft-card hover:shadow-soft-hover transition-all flex flex-col items-center text-center group"
    {...uiMeta({
      id: `home.category.${category.slug}`,
      component: 'CategoryTile',
      source: SOURCE,
    })}
  >
    <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center text-2xl mb-3">
      <i className={category.icon} />
    </div>
    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand">
      {category.name}
    </span>
    <span className="text-[11px] text-slate-400 mt-1">{category.count} productos</span>
  </Link>
)
