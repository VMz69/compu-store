import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { IconButton } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OfferBuilderApi } from './02-useOfferBuilder'
import { MIN_MARGIN_PERCENT, type MarginLevel } from '../54-pipeline-precio-ofertas/02-offerPricing'

const t = tracer('OfferProductList', 'src/53-pipeline-preparacion-ofertas/04-OfferProductList.tsx')

const LEVEL: Record<MarginLevel, { label: string; className: string }> = {
  ok: { label: 'Margen sano', className: 'text-emerald-600 dark:text-emerald-400' },
  low: { label: `Margen bajo (< ${MIN_MARGIN_PERCENT}%)`, className: 'text-amber-600 dark:text-amber-400' },
  below_cost: { label: 'Bajo el costo', className: 'text-red-600 dark:text-red-400' },
  no_cost: { label: 'Sin costo registrado', className: 'text-slate-400' },
}

/** Paso 3 · Productos con su análisis: precio base → oferta, ahorro y margen. */
export function OfferProductList({ b }: { b: OfferBuilderApi }) {
  return (
    <section className="space-y-2" {...t('promotions.builder.products')}>
      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">3 · Productos ({b.analyses.length})</h3>
      {b.analyses.length === 0 ? (
        <p className="text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">Elige productos del catálogo de la izquierda.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {b.analyses.map((a) => (
            <li key={a.product.id} className={cn('p-2.5 flex items-center gap-3', a.level === 'below_cost' ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-white dark:bg-slate-900')} {...t(`promotions.builder.product.${a.product.id}`)}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{a.product.name}</p>
                <p className={cn('text-[10px] font-semibold', LEVEL[a.level].className)}>
                  {LEVEL[a.level].label}
                  {a.margin !== null && ` · ${formatCurrency(a.margin)} (${(a.marginPercent ?? 0).toFixed(1)}%)`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-brand tabular-nums">{formatCurrency(a.offerPrice)}</p>
                <p className="text-[10px] text-slate-400 tabular-nums"><s>{formatCurrency(a.basePrice)}</s> · −{a.savingPercent.toFixed(0)}%</p>
              </div>
              {!b.readOnly && (
                <IconButton icon="fa-solid fa-xmark" label={`Quitar ${a.product.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => b.removeProduct(a.product.id)} {...t(`promotions.builder.remove.${a.product.id}`)} />
              )}
            </li>
          ))}
        </ul>
      )}
      {b.errors.products && <p role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400">{b.errors.products}</p>}
    </section>
  )
}
