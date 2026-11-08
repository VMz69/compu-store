import { usePdfDocument } from '@/shared/hooks/usePdfDocument'
import { formatCurrency } from '@/shared/lib/currency'
import { buildWhatsAppLink } from '@/shared/lib/whatsapp'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { invoiceTotals } from '../lib/invoice.service'
import { buildInvoicePdf, invoicePdfFilename } from '../lib/invoicePdf'
import { useBillingStore } from '../store'

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
