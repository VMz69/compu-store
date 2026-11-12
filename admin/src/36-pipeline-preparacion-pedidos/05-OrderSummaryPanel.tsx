import { CustomerPicker } from '@/00-director-clientes'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { Button, ExtraChargesEditor, IconButton, LineItemsEditor } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OrderBuilderApi } from './03-useOrderBuilder'
import { OrderDeliverySection } from './04-OrderDeliverySection'

const t = tracer('OrderSummaryPanel', 'src/features/sales/components/builder/OrderSummaryPanel.tsx')

/** Panel derecho del constructor: cliente → productos → venta y entrega → cargos extra → totales → registrar. */
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
        <ExtraChargesEditor
          title="4 · Cargos extra"
          charges={b.charges}
          errors={b.errors}
          emptyText="Opcional. Envío, instalación u otros servicios que el cliente paga junto al pedido."
          traceId="sales.builder.charges"
        />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl space-y-3">
        <dl className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <dt>Productos{b.totals.discount > 0 && ' · descuentos'}</dt>
            <dd className="font-bold tabular-nums">
              {formatCurrency(b.totals.gross)}
              {b.totals.discount > 0 && ` · −${formatCurrency(b.totals.discount)}`}
            </dd>
          </div>
          {b.totals.chargesTotal > 0 && (
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <dt>Cargos extra ({b.charges.rows.length})</dt>
              <dd className="font-bold tabular-nums">+{formatCurrency(b.totals.chargesTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
            <dt className="text-xs font-black text-slate-800 dark:text-slate-100">Total (IVA incluido)</dt>
            <dd className="text-lg font-black text-brand tabular-nums">{formatCurrency(b.totals.total)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {b.canDelete && (
            <IconButton
              icon="fa-solid fa-trash-can"
              label="Eliminar pedido"
              tone="danger"
              sizeClass="w-9 h-9 rounded-lg"
              disabled={b.isLoading}
              onClick={b.remove}
              {...t('sales.builder.delete')}
            />
          )}
          <Button variant="outline" size="md" onClick={b.cancel} {...t('sales.builder.cancel')}>
            Cancelar
          </Button>
          <Button
            size="md"
            icon={b.isEdit ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-clipboard-list'}
            className="flex-1 whitespace-nowrap"
            isLoading={b.isLoading}
            onClick={b.register}
            title={b.isEdit ? 'Guarda los cambios; el pedido conserva su estado' : 'Registra el pedido; podrás confirmarlo desde su detalle'}
            {...t(b.isEdit ? 'sales.builder.save' : 'sales.builder.register')}
          >
            {b.submitLabel}
          </Button>
        </div>
      </div>
    </aside>
  )
}
