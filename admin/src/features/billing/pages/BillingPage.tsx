import { formatCurrency } from '@/shared/lib/currency'
import { Button, EmptyState, Pagination } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { BillingToolbar } from '../components/list/BillingToolbar'
import { InvoicesTable } from '../components/list/InvoicesTable'
import { PendingOrdersTable } from '../components/list/PendingOrdersTable'
import { useBilling } from '../hooks/useBilling'

const t = tracer('BillingPage', 'src/features/billing/pages/BillingPage.tsx')

/**
 * /facturacion · Salida de pedidos.
 * "Por facturar" es la cola de trabajo; "Facturas emitidas" es el registro con PDF y anulación.
 */
export function BillingPage() {
  const b = useBilling()
  const isPending = b.tab === 'pending'

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('billing')}>
      <BillingToolbar b={b} />

      <div key={`${b.tab}-${b.pagination.page}`} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-3" {...t('billing.content')}>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {isPending ? (
            <>
              <b className="text-slate-700 dark:text-slate-200">{b.summary.pendingCount}</b> pedido(s) por facturar por{' '}
              <b className="text-slate-700 dark:text-slate-200">{formatCurrency(b.summary.pendingAmount)}</b>. Al facturar se descuenta el
              inventario y el pedido pasa a Facturado.
            </>
          ) : (
            <>
              Total facturado (vigente): <b className="text-slate-700 dark:text-slate-200">{formatCurrency(b.summary.billedTotal)}</b>.
              Anular una factura repone el stock y devuelve el pedido a la cola.
            </>
          )}
        </p>

        {b.search.active && b.search.resultCount === 0 ? (
          <EmptyState
            icon="fa-solid fa-magnifying-glass"
            title={`Sin resultados para «${b.search.value.trim()}».`}
            hint="Prueba con otras palabras: número, cliente, producto, NIT…"
            action={<Button variant="outline" size="md" onClick={b.search.clear} {...t('billing.search.clear')}>Limpiar búsqueda</Button>}
            {...t('billing.search.empty')}
          />
        ) : isPending ? (
          <PendingOrdersTable orders={b.pending} canInvoice={b.canInvoice} onInvoice={b.openEmit} />
        ) : b.issuedCount === 0 ? (
          <EmptyState icon="fa-solid fa-file-invoice" title="No hay facturas que coincidan." hint="Ajusta la búsqueda o el filtro." />
        ) : (
          <InvoicesTable issued={b.issued} canInvoice={b.canInvoice} openPreview={b.openPreview} promptVoid={b.promptVoid} />
        )}
      </div>

      {!isPending && <Pagination pagination={b.pagination} idPrefix="billing" itemLabel="facturas" />}
    </div>
  )
}
