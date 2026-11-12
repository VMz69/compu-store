import { useQuoteOrderLink } from '@/00-director-ventas'
import { usePdfDocument } from '@/79-pipeline-consulta-documentos/02-usePdfDocument'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { buildWhatsAppLink } from '@/83-pipeline-recursos-publicos/04-whatsapp'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { calcTotals, effectiveStatus } from '../51-pipeline-persistencia-cotizaciones/02-quote.service'
import { buildQuotePdf, quotePdfFilename } from './03-quotePdf'
import { useQuotesStore } from '../51-pipeline-persistencia-cotizaciones/00-director-persistencia-cotizaciones'

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
