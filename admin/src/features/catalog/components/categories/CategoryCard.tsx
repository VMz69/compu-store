import { Card } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { Category } from '../../types'

const t = tracer('CategoryCard', 'src/features/catalog/components/categories/CategoryCard.tsx')

interface CategoryCardProps {
  category: Category
  count: number
  onShowProducts: (categoryId: string) => void
}

export function CategoryCard({ category, count, onShowProducts }: CategoryCardProps) {
  return (
    <Card
      className="p-4 hover:border-brand transition-colors flex flex-col justify-between"
      {...t(`catalog.category.${category.id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg shrink-0">
          <i className={category.icon} aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{category.name}</h4>
          <span className="text-[10px] font-mono text-slate-400">slug: /{category.slug}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{category.description}</p>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-200">{count} artículos activos</span>
        <button
          type="button"
          className="text-brand font-bold hover:underline"
          onClick={() => onShowProducts(category.id)}
          {...t(`catalog.category.show.${category.id}`)}
        >
          Ver productos
        </button>
      </div>
    </Card>
  )
}
