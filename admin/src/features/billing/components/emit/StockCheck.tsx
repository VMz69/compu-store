import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { tracer } from '@/00-trazabilidad'
import type { InvoiceEmitApi } from '../../hooks/useInvoiceEmit'
import { isProductItem, lineAmount } from '../../lib/invoice.service'

const t = tracer('StockCheck', 'src/features/billing/components/emit/StockCheck.tsx')

const BADGE = 'text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap'
const BADGE_OK = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
const BADGE_FAIL = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50'
const BADGE_SERVICE = 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'

type StockCheckProps = Pick<InvoiceEmitApi, 'items' | 'availability' | 'totals'>

/** Detalle a facturar con verificación de stock por producto; los cargos extra no tocan inventario. */
export function StockCheck({ items, availability, totals }: StockCheckProps) {
  return (
    <section className="space-y-2" {...t('billing.emit.items')}>
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Detalle y salida de inventario</h4>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {items.map((item) => {
          const stock = isProductItem(item) ? availability.find((a) => a.productId === item.productId) : undefined
          return (
            <li key={item.productId} className="p-3 flex items-center gap-3 bg-white dark:bg-slate-900" {...t(`billing.emit.item.${item.productId}`)}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.description}</p>
                <p className="text-[10px] text-slate-400">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              {isProductItem(item) ? (
                <span className={cn(BADGE, stock?.ok ? BADGE_OK : BADGE_FAIL)}>
                  {!stock?.exists ? 'No existe en catálogo' : stock.ok ? `Stock ${stock.available} → ${stock.available - stock.requested}` : `Solo hay ${stock.available}`}
                </span>
              ) : (
                <span className={cn(BADGE, BADGE_SERVICE)}>
                  <i className="fa-solid fa-receipt mr-1" aria-hidden="true" />
                  Cargo extra · sin inventario
                </span>
              )}
              <span className="w-20 text-right text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(lineAmount(item))}</span>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {totals.units} unidad(es)
          {totals.charges > 0 && ` · cargos extra ${formatCurrency(totals.charges)}`} · IVA incluido
        </span>
        <span className="text-base font-black text-brand tabular-nums">{formatCurrency(totals.total)}</span>
      </div>
    </section>
  )
}
