import { usePdfDocument } from '@/79-pipeline-consulta-documentos/02-usePdfDocument'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { buildWhatsAppLink } from '@/83-pipeline-recursos-publicos/04-whatsapp'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { invoiceTotals } from '../47-pipeline-persistencia-facturas/02-invoice.service'
import { buildInvoicePdf, invoicePdfFilename } from './03-invoicePdf'
import { useBillingStore } from '../47-pipeline-persistencia-facturas/00-director-persistencia-facturas'

/** Vista previa del PDF de una factura (payload del modal: número de control). */
export function useInvoicePreview() {
  const invoiceId = useModalPayload<string>()
  const invoice = useBillingStore((s) => s.invoices.find((i) => i.id === invoiceId))
  const pdf = usePdfDocument(invoice, buildInvoicePdf)

  if (!invoice) return null
  const total = invoiceTotals(invoice.items).total

  return {
    invoice,
    total,
    pdf,
    filename: invoicePdfFilename(invoice),
    whatsappLink:
      invoice.receptor.phone && invoice.status === 'emitida'
        ? buildWhatsAppLink(
            invoice.receptor.phone,
            `Hola, te escribimos de ${invoice.issuer.tradeName}. Tu factura ${invoice.internalId} por ${formatCurrency(total)} ya fue emitida. ¡Gracias por tu compra!`,
          )
        : null,
    onClose: closeModal,
  }
}
