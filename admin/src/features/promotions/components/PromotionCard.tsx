import { Card } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { Promotion } from '../types'

const t = tracer('PromotionCard', 'src/features/promotions/components/PromotionCard.tsx')

interface PromotionCardProps {
  promotion: Promotion
  onShowItems: (categoryId: string) => void
}

export function PromotionCard({ promotion: p, onShowItems }: PromotionCardProps) {
  return (
    <Card className="p-4 flex flex-col justify-between" {...t(`promotions.card.${p.id}`)}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-amber-950">
            {p.badge}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">
            <i className="fa-solid fa-circle text-[8px]" aria-hidden="true" /> {p.active ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{p.title}</h4>
        <p className="text-xs font-extrabold text-brand mt-1">{p.discountText}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{p.description}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          Categoría: <b className="text-slate-700 dark:text-slate-200 capitalize">{p.targetCategory}</b>
        </span>
        <button
          type="button"
          className="text-brand font-bold hover:underline"
          onClick={() => onShowItems(p.targetCategory)}
          {...t(`promotions.card.items.${p.id}`)}
        >
          Ver ítems
        </button>
      </div>
    </Card>
  )
}
