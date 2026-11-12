import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { formatDateTime } from '@/71-pipeline-seleccion-fechas/05-date'
import { DataTable, IconButton, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { BillingApi } from '../../hooks/useBilling'
import { InvoiceStatusBadge } from '../InvoiceStatusBadge'

const t = tracer('InvoicesTable', 'src/features/billing/components/list/InvoicesTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Factura', className: 'px-4' },
  { label: 'Receptor' },
  { label: 'Pedido' },
  { label: 'Condición' },
  { label: 'Total', className: 'px-3 text-right' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

type InvoicesTableProps = Pick<BillingApi, 'issued' | 'canInvoice' | 'openPreview' | 'promptVoid'>

/** Registro de facturas emitidas. Anular repone stock y reabre el pedido. */
export function InvoicesTable({ issued, canInvoice, openPreview, promptVoid }: InvoicesTableProps) {
  return (
    <DataTable headers={HEADERS} {...t('billing.issued.table')}>
      {issued.map(({ invoice: inv, totals }) => (
        <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`billing.issued.row.${inv.internalId}`)}>
          <td className="py-3 px-4">
            <button
              type="button"
              className="font-bold text-brand hover:underline flex items-center gap-1.5"
              onClick={() => openPreview(inv)}
              {...t(`billing.issued.open.${inv.internalId}`)}
            >
              <i className="fa-solid fa-file-invoice text-[11px]" aria-hidden="true" /> N.º {inv.internalId}
            </button>
            <p className="text-[10px] font-mono text-slate-400">{inv.id}</p>
            <p className="text-[10px] text-slate-400">{formatDateTime(inv.createdAt)}</p>
          </td>
          <td className="py-3 px-3">
            <p className="font-bold text-slate-800 dark:text-slate-100">{inv.receptor.name}</p>
            <p className="text-[10px] text-slate-400">{inv.receptor.documentId || 'Sin documento'}</p>
          </td>
          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">{inv.orderId}</td>
          <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">{inv.paymentCondition}</td>
          <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(totals.total)}</td>
          <td className="py-3 px-3">
            <InvoiceStatusBadge status={inv.status} />
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center justify-end gap-1.5">
              <IconButton icon="fa-solid fa-eye" label="Ver PDF" tone="brand" onClick={() => openPreview(inv)} {...t(`billing.issued.preview.${inv.internalId}`)} />
              {canInvoice && inv.status === 'emitida' && (
                <IconButton icon="fa-solid fa-ban" label="Anular factura" tone="danger" onClick={() => promptVoid(inv)} {...t(`billing.issued.void.${inv.internalId}`)} />
              )}
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
