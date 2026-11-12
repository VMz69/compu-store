import { useQuoteOrderLink } from '@/00-director-ventas'
import { usePdfDocument } from '@/shared/hooks/usePdfDocument'
import { formatCurrency } from '@/shared/lib/currency'
import { buildWhatsAppLink } from '@/shared/lib/whatsapp'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { calcTotals, effectiveStatus } from '../lib/quote.service'
import { buildQuotePdf, quotePdfFilename } from '../lib/quotePdf'
import { useQuotesStore } from '../store'

/** Vista previa del PDF de una cotización (payload del modal: id de la cotización). */
export function useQuotePreview() {
  const quoteId = useModalPayload<string>()
  const quote = useQuotesStore((s) => s.quotes.find((q) => q.id === quoteId))
  const pdf = usePdfDocument(quote, buildQuotePdf)
  const orderOf = useQuoteOrderLink()

  if (!quote) return null
  const total = calcTotals(quote.items, quote.charges ?? [], quote.issuer.taxRate).total

  return {
    quote,
    status: effectiveStatus(quote, orderOf(quote.id)),
    total,
    pdf,
    filename: quotePdfFilename(quote),
    whatsappLink: quote.customer.phone
      ? buildWhatsAppLink(
          quote.customer.phone,
          `Hola ${quote.customer.name}, te compartimos la cotización ${quote.id} de ${quote.issuer.name} por ${formatCurrency(total)}. Quedamos atentos.`,
        )
      : null,
    onClose: closeModal,
  }
}
