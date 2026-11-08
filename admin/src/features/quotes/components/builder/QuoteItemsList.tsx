import { formatCurrency } from '@/shared/lib/currency'
import { AffixInput, IconButton } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { QuoteBuilderApi } from '../../hooks/useQuoteBuilder'

const t = tracer('QuoteItemsList', 'src/features/quotes/components/builder/QuoteItemsList.tsx')

const STEP =
  'w-7 h-8 flex items-center justify-center text-slate-500 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'

/** Paso 2 · Productos cotizados: cantidad (stepper), descuento por línea y total. */
export function QuoteItemsList({ b }: { b: QuoteBuilderApi }) {
  return (
    <section className="space-y-3" {...t('quotes.builder.items')}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">2 · Productos ({b.items.length})</h3>
        {b.totals.units > 0 && <span className="text-[10px] text-slate-400">{b.totals.units} unidades</span>}
      </div>

      {b.items.length === 0 ? (
        <p
          className={
            b.errors.items
              ? 'py-6 px-3 text-center rounded-xl border border-dashed border-red-300 dark:border-red-800 text-[11px] font-semibold text-red-600 dark:text-red-400'
              : 'py-6 px-3 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] text-slate-400'
          }
          role={b.errors.items ? 'alert' : undefined}
        >
          <i className="fa-solid fa-hand-pointer mr-1.5" aria-hidden="true" />
          {b.errors.items ?? 'Elige productos del catálogo para agregarlos aquí.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {b.items.map(({ item, total }) => (
            <li key={item.productId} className="p-3 bg-white dark:bg-slate-900 space-y-2" {...t(`quotes.builder.item.${item.productId}`)}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.name}</p>
                  <p className="text-[10px] text-slate-400"><span className="font-mono">{item.sku}</span> · {formatCurrency(item.unitPrice)} c/u</p>
                </div>
                <IconButton icon="fa-solid fa-xmark" label={`Quitar ${item.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => b.removeItem(item.productId)} {...t(`quotes.builder.item.remove.${item.productId}`)} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="group" aria-label="Cantidad">
                  <button type="button" className={STEP} aria-label="Restar una unidad" onClick={() => b.stepQuantity(item.productId, -1)} {...t(`quotes.builder.item.decrement.${item.productId}`)}>
                    <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={b.onQuantity(item.productId)}
                    aria-label={`Cantidad de ${item.name}`}
                    className="w-11 h-8 text-center text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    {...t(`quotes.builder.item.qty.${item.productId}`)}
                  />
                  <button type="button" className={STEP} aria-label="Sumar una unidad" onClick={() => b.stepQuantity(item.productId, 1)} {...t(`quotes.builder.item.increment.${item.productId}`)}>
                    <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
                  </button>
                </div>
                <div className="w-24">
                  <AffixInput suffix="% desc." type="number" min="0" max="100" step="1" value={String(item.discountPercent)} onChange={b.onDiscount(item.productId)} aria-label={`Descuento de ${item.name}`} {...t(`quotes.builder.item.discount.${item.productId}`)} />
                </div>
                <span className="ml-auto text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
