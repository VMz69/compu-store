import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { PdfPreviewModal } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useInvoicePreview } from './02-useInvoicePreview'
import { InvoiceStatusBadge } from './04-InvoiceStatusBadge'

const t = tracer('InvoicePreviewModal', 'src/46-pipeline-documento-factura/01-InvoicePreviewModal.tsx')

/** Vista previa del PDF de la factura (mismo visor que las cotizaciones). */
export function InvoicePreviewModal() {
  const p = useInvoicePreview()
  if (!p) return null
  const { invoice } = p

  return (
    <PdfPreviewModal
      traceId={`billing.preview.${invoice.internalId}`}
      title={
        <>
          Factura N.º {invoice.internalId} <InvoiceStatusBadge status={invoice.status} />
        </>
      }
      subtitle={`${invoice.receptor.name} · ${formatCurrency(p.total)} · Pedido ${invoice.orderId}`}
      pdf={p.pdf}
      filename={p.filename}
      onClose={p.onClose}
      footerStart={
        p.whatsappLink && (
          <a href={p.whatsappLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-whatsapp hover:underline flex items-center gap-1.5" {...t('billing.preview.whatsapp')}>
            <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true" /> Avisar al cliente
          </a>
        )
      }
    />
  )
}
