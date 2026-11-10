import { formatCurrency } from '@/shared/lib/currency'
import type { OrderDetailApi } from '../../hooks/useOrderDetail'

type OrderLinesProps = Pick<OrderDetailApi, 'lines' | 'totals'>

/** Desglose de artículos con descuentos y totales del pedido. */
export function OrderLines({ lines, totals }: OrderLinesProps) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose de artículos</h4>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
        {lines.map((line) => (
          <div key={line.productId} className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100">{line.name}</p>
              <span className="text-[10px] text-slate-400">
                <span className="font-mono">{line.sku}</span> · {line.quantity} × {formatCurrency(line.unitPrice)}
                {line.discountPercent > 0 && <b className="text-amber-600"> · −{line.discountPercent}%</b>}
              </span>
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(line.total)}</span>
          </div>
        ))}
      </div>
      <dl className="mt-3 space-y-1 text-[11px]">
        {totals.discount > 0 && (
          <div className="flex justify-between text-slate-500">
            <dt>Subtotal · Descuentos</dt>
            <dd className="tabular-nums">{formatCurrency(totals.gross)} · −{formatCurrency(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between items-center">
          <dt className="font-bold text-slate-500">Total a pagar (IVA incluido)</dt>
          <dd className="text-lg font-black text-brand tabular-nums">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
    </div>
  )
}
