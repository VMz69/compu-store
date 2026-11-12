import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import type { OrderDetailApi } from './02-useOrderDetail'

type OrderLinesProps = Pick<OrderDetailApi, 'lines' | 'charges' | 'totals'>

/** Desglose de artículos, cargos extra y totales del pedido. */
export function OrderLines({ lines, charges, totals }: OrderLinesProps) {
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
        {charges.map((charge) => (
          <div key={charge.id} className="p-3 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/30">
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100">{charge.concept}</p>
              <span className="text-[10px] text-slate-400">
                <i className="fa-solid fa-receipt mr-1" aria-hidden="true" />
                Cargo extra · sin inventario
              </span>
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(charge.amount)}</span>
          </div>
        ))}
      </div>
      <dl className="mt-3 space-y-1 text-[11px]">
        {totals.discount > 0 && (
          <div className="flex justify-between text-slate-500">
            <dt>Productos · Descuentos</dt>
            <dd className="tabular-nums">{formatCurrency(totals.gross)} · −{formatCurrency(totals.discount)}</dd>
          </div>
        )}
        {totals.chargesTotal > 0 && (
          <div className="flex justify-between text-slate-500">
            <dt>Cargos extra</dt>
            <dd className="tabular-nums">+{formatCurrency(totals.chargesTotal)}</dd>
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
