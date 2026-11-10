import { Card, IconButton } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { CategoriesTabApi } from '../../hooks/taxonomy/useCategoriesTab'

const t = tracer('CategoryCard', 'src/features/catalog/components/taxonomy/CategoryCard.tsx')

type CategoryItem = CategoriesTabApi['items'][number]

interface CategoryCardProps {
  item: CategoryItem
  api: CategoriesTabApi
}

/** Tarjeta de categoría: identidad, uso (productos visibles/total) y acciones. */
export function CategoryCard({ item, api }: CategoryCardProps) {
  const { category: c, productCount, visibleCount, deleteBlock } = item

  return (
    <Card className="p-4 flex flex-col gap-3 hover:border-brand/60 transition-colors" {...t(`catalog.category.${c.id}`)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg shrink-0">
          <i className={c.icon} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</h4>
          <span className="text-[10px] font-mono text-slate-400">/{c.slug}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {api.canEdit && (
            <IconButton icon="fa-solid fa-pen" label={`Editar ${c.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => api.edit(c)} {...t(`catalog.category.edit.${c.id}`)} />
          )}
          {api.canDelete && (
            <IconButton
              icon="fa-solid fa-trash-can"
              label={deleteBlock ? `No se puede eliminar: ${deleteBlock}` : `Eliminar ${c.name}`}
              tone="plain"
              sizeClass="w-7 h-7"
              className={deleteBlock ? 'opacity-40' : 'hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!'}
              aria-disabled={Boolean(deleteBlock)}
              onClick={() => api.remove(c, deleteBlock)}
              {...t(`catalog.category.delete.${c.id}`)}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-8">{c.description || 'Sin descripción.'}</p>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span title={`${visibleCount} visibles en la web de ${productCount}`}>
            <i className="fa-solid fa-box mr-1 text-slate-400" aria-hidden="true" />
            <b className="text-slate-700 dark:text-slate-200">{productCount}</b> producto(s)
            {productCount > visibleCount && <span className="text-slate-400"> · {visibleCount} en web</span>}
          </span>
        </div>
        <button type="button" className="text-brand font-bold hover:underline whitespace-nowrap" onClick={() => api.showProducts(c.id)} {...t(`catalog.category.show.${c.id}`)}>
          Ver productos
        </button>
      </div>
    </Card>
  )
}
