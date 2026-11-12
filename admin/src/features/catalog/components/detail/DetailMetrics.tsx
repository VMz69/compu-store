import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import type { ProductDetailApi } from '../../hooks/useProductDetail'
import type { StockSeverity } from '../../types'

const STOCK_TEXT: Record<StockSeverity, string> = {
  out: 'text-red-500',
  low: 'text-amber-500',
  ok: 'text-slate-800 dark:text-slate-100',
}

type DetailMetricsProps = Pick<ProductDetailApi, 'product' | 'pricing' | 'severity'>

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className={cn('text-sm font-black', valueClass)}>{value}</span>
    </div>
  )
}

export function DetailMetrics({ product, pricing, severity }: DetailMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
      <Metric label="Existencias" value={`${product.stock} unid.`} valueClass={STOCK_TEXT[severity]} />
      <Metric
        label="Valor Stock"
        value={formatCurrency(pricing.stockValue)}
        valueClass="text-slate-800 dark:text-slate-100"
      />
      <Metric label="Garantía" value="Local Sellada" valueClass="text-emerald-600" />
      <Metric label="Ubicación" value="Cojutepeque" valueClass="text-slate-800 dark:text-slate-100" />
    </div>
  )
}
