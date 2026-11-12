import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { CategoryWithCount } from '@/00-director-modelos'

const SOURCE = 'src/27-pipeline-inicio/02-acceso-categoria.tsx'

export const CategoryTile = ({ category }: { category: CategoryWithCount }) => (
  <Link
    to={`/category/${category.slug}`}
    className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand shadow-soft-card hover:shadow-soft-hover transition-all flex flex-col items-center text-center group"
    {...uiMeta({
      id: `home.category.${category.slug}`,
      component: 'CategoryTile',
      source: SOURCE,
    })}
  >
    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3">
      <i className={category.icon} />
    </div>
    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand">
      {category.name}
    </span>
    <span className="text-[11px] text-slate-400 mt-1">{category.count} productos</span>
  </Link>
)
