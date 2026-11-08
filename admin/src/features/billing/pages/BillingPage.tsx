import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/currency'
import { EmptyState, Pagination, SearchInput, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { InvoicesTable } from '../components/list/InvoicesTable'
import { PendingOrdersTable } from '../components/list/PendingOrdersTable'
import { useBilling } from '../hooks/useBilling'

const t = tracer('BillingPage', 'src/features/billing/pages/BillingPage.tsx')

const TAB = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5'
const TAB_ACTIVE = 'bg-brand text-white shadow-2xs'
const TAB_IDLE = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'

/**
 * /facturacion · Salida de pedidos.
 * "Por facturar" es la cola de trabajo; "Facturas emitidas" es el registro con PDF y anulación.
 */
export function BillingPage() {
  const b = useBilling()
  const isPending = b.tab === 'pending'

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('billing')}>
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3" {...t('billing.toolbar')}>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Secciones de facturación">
          <button type="button" role="tab" aria-selected={isPending} className={cn(TAB, isPending ? TAB_ACTIVE : TAB_IDLE)} onClick={b.showPending} {...t('billing.tab.pending')}>
            <i className="fa-solid fa-inbox text-[10px]" aria-hidden="true" /> Por facturar ({b.summary.pendingCount})
          </button>
          <button type="button" role="tab" aria-selected={!isPending} className={cn(TAB, !isPending ? TAB_ACTIVE : TAB_IDLE)} onClick={b.showIssued} {...t('billing.tab.issued')}>
            <i className="fa-solid fa-file-invoice text-[10px]" aria-hidden="true" /> Facturas emitidas ({b.summary.issuedCount})
          </button>
        </div>
        {!isPending && (
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={b.filters.search} onChange={b.filters.onSearch} placeholder="Buscar por número, pedido o receptor…" aria-label="Buscar facturas" {...t('billing.issued.search')} />
            <Select tone="filter" options={b.filters.statusOptions} value={b.filters.status} onChange={b.filters.onStatus} aria-label="Filtrar por estado" {...t('billing.issued.status')} />
          </div>
        )}
      </div>

      <div key={`${b.tab}-${b.pagination.page}`} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-3" {...t('billing.content')}>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {isPending ? (
            <>
              <b className="text-slate-700 dark:text-slate-200">{b.summary.pendingCount}</b> pedido(s) por facturar por{' '}
              <b className="text-slate-700 dark:text-slate-200">{formatCurrency(b.summary.pendingAmount)}</b>. Al facturar se descuenta el
              inventario y el pedido pasa a Entregado.
            </>
          ) : (
            <>
              Total facturado (vigente): <b className="text-slate-700 dark:text-slate-200">{formatCurrency(b.summary.billedTotal)}</b>.
              Anular una factura repone el stock y devuelve el pedido a la cola.
            </>
          )}
        </p>

        {isPending ? (
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
