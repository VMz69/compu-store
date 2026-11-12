import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/currency'
import { tracer } from '@/00-trazabilidad'
import type { CommercialSummary as Summary } from '../../../lib/commercial'

const t = tracer('CommercialSummary', 'src/features/catalog/components/form/tabs/CommercialSummary.tsx')

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-[11px] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={cn('text-xs font-bold tabular-nums', valueClass ?? 'text-slate-800 dark:text-slate-100')}>{value}</dd>
    </div>
  )
}

const pct = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)} %`)

/** Panel de lectura con cálculos en vivo: precio neto, IVA, margen y descuento. */
export function CommercialSummary({ summary }: { summary: Summary }) {
  const marginTone = summary.isNegativeMargin
    ? 'text-red-600 dark:text-red-400'
    : 'text-emerald-600 dark:text-emerald-400'

  return (
    <aside
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 h-fit"
      aria-label="Resumen comercial"
      {...t('catalog.product-form.summary')}
    >
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        <i className="fa-solid fa-calculator text-brand" aria-hidden="true" /> Resumen comercial
      </h4>
      <dl className="divide-y divide-slate-200 dark:divide-slate-700">
        <Row label="Precio sin IVA" value={formatCurrency(summary.netPrice)} />
        <Row label="IVA incluido" value={formatCurrency(summary.taxAmount)} />
        <Row
          label="Margen bruto"
          value={summary.margin === null ? 'Sin costo' : formatCurrency(summary.margin)}
          valueClass={summary.margin === null ? 'text-slate-400' : marginTone}
        />
        <Row
          label="Margen %"
          value={pct(summary.marginPercent)}
          valueClass={summary.marginPercent === null ? 'text-slate-400' : marginTone}
        />
        <Row
          label="Descuento visible"
          value={pct(summary.discountPercent)}
          valueClass={summary.discountPercent === null ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}
        />
      </dl>
      {summary.isNegativeMargin && (
        <p role="alert" className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-[10px] font-bold text-red-600 dark:text-red-400">
          <i className="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true" />
          El precio neto queda por debajo del costo.
        </p>
      )}
    </aside>
  )
}
