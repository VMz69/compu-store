import { CustomerPicker } from '@/features/customers'
import { formatCurrency } from '@/shared/lib/currency'
import { Button, LineItemsEditor } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderBuilderApi } from '../../hooks/useOrderBuilder'
import { OrderDeliverySection } from './OrderDeliverySection'

const t = tracer('OrderSummaryPanel', 'src/features/sales/components/builder/OrderSummaryPanel.tsx')

/** Panel derecho del constructor: cliente → productos → venta y entrega → totales → registrar. */
export function OrderSummaryPanel({ b }: { b: OrderBuilderApi }) {
  return (
    <aside className="flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm" aria-label="Resumen del pedido" {...t('sales.builder.summary')}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <CustomerPicker selection={b.customer} errors={b.errors} title="1 · Cliente" traceId="sales.builder.customer" />
        <LineItemsEditor
          title="2 · Productos"
          lines={b.lines}
          units={b.totals.units}
          error={b.errors.items}
          emptyText="Elige productos con stock disponible del catálogo."
          traceId="sales.builder.items"
          {...b.lineHandlers}
        />
        <OrderDeliverySection b={b} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl space-y-3">
        <dl className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <dt>Subtotal{b.totals.discount > 0 && ' · descuentos'}</dt>
            <dd className="font-bold tabular-nums">
              {formatCurrency(b.totals.gross)}
              {b.totals.discount > 0 && ` · −${formatCurrency(b.totals.discount)}`}
            </dd>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
            <dt className="text-xs font-black text-slate-800 dark:text-slate-100">Total (IVA incluido)</dt>
            <dd className="text-lg font-black text-brand tabular-nums">{formatCurrency(b.totals.total)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={b.cancel} {...t('sales.builder.cancel')}>
            Cancelar
          </Button>
          <Button variant="soft" size="md" icon="fa-solid fa-clipboard-list" className="whitespace-nowrap" isLoading={b.isLoading} onClick={b.register} {...t('sales.builder.register')}>
            Registrar
          </Button>
          {b.canConfirm && (
            <Button size="md" icon="fa-solid fa-box-open" className="flex-1 whitespace-nowrap" isLoading={b.isLoading} onClick={b.registerAndConfirm} title="Registra el pedido y reserva el stock" {...t('sales.builder.register-confirm')}>
              Registrar y confirmar
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
