import { formatCurrency } from '@/shared/lib/currency'
import { Button, Field, Select, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { QuoteBuilderApi } from '../../hooks/useQuoteBuilder'
import { QuoteCustomerSection } from './QuoteCustomerSection'
import { QuoteItemsList } from './QuoteItemsList'

const t = tracer('QuoteSummaryPanel', 'src/features/quotes/components/builder/QuoteSummaryPanel.tsx')

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? 'text-xs font-black text-slate-800 dark:text-slate-100' : 'text-[11px] text-slate-500 dark:text-slate-400'}>{label}</dt>
      <dd className={strong ? 'text-lg font-black text-brand tabular-nums' : 'text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums'}>{value}</dd>
    </div>
  )
}

/** Panel derecho del constructor: cliente → productos → condiciones → totales → generar. */
export function QuoteSummaryPanel({ b }: { b: QuoteBuilderApi }) {
  return (
    <aside className="flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm" aria-label="Resumen de la cotización" {...t('quotes.builder.summary')}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <QuoteCustomerSection b={b} />
        <QuoteItemsList b={b} />

        <section className="space-y-3" {...t('quotes.builder.conditions')}>
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">3 · Condiciones</h3>
          <Field label="Validez" variant="caps">
            <Select options={b.validityOptions} className="w-full" {...b.bind('validityDays')} {...t('quotes.builder.validity')} />
          </Field>
          <Field label="Notas para el cliente" variant="caps" hint="Aparecen en el PDF (forma de pago, entrega, etc.).">
            <Textarea className="h-16" placeholder="Ej. Requiere Crédito Fiscal. Entrega en 48 h." {...b.bind('notes')} {...t('quotes.builder.notes')} />
          </Field>
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl space-y-3">
        <dl className="space-y-1.5">
          <TotalRow label="Subtotal" value={formatCurrency(b.totals.gross)} />
          {b.totals.discount > 0 && <TotalRow label="Descuentos" value={`- ${formatCurrency(b.totals.discount)}`} />}
          <TotalRow label={`IVA ${b.taxPercent}% incluido`} value={formatCurrency(b.totals.tax)} />
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
            <TotalRow label="Total a pagar" value={formatCurrency(b.totals.total)} strong />
          </div>
        </dl>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={b.cancel} {...t('quotes.builder.cancel')}>
            Cancelar
          </Button>
          <Button size="md" icon="fa-solid fa-file-pdf" className="flex-1" isLoading={b.isLoading} onClick={b.generate} {...t('quotes.builder.generate')}>
            Generar cotización
          </Button>
        </div>
      </div>
    </aside>
  )
}
