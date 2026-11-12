import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { CategoryWithCount } from '@/00-director-modelos'

const SOURCE = 'src/11-pipeline-categorias/03-tarjeta-categoria.tsx'

interface CategoryCardProps {
  category: CategoryWithCount
}

export const CategoryCard = ({ category }: CategoryCardProps) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft-card dark:shadow-none hover:shadow-soft-hover transition-all flex flex-col justify-between group"
    {...uiMeta({
      id: `catalog.category-card.${category.slug}`,
      component: 'CategoryCard',
      source: SOURCE,
    })}
  >
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center text-2xl">
          <i className={category.icon} />
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {category.count} productos
        </span>
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-brand transition-colors">
          {category.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {category.description}
        </p>
      </div>
    </div>
    <Link
      to={`/category/${category.slug}`}
      className="mt-4 sm:mt-6 w-full py-2.5 px-4 rounded-xl border border-brand text-brand hover:bg-brand hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
      {...uiMeta({
        id: `catalog.category-card.${category.slug}.cta`,
        component: 'CategoryCard',
        source: SOURCE,
      })}
    >
      <span>Explorar {category.name}</span>
      <i className="fa-solid fa-arrow-right text-[10px]" />
    </Link>
  </div>
)
