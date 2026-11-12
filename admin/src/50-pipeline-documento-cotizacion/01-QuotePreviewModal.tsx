import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { PdfPreviewModal } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useQuotePreview } from './02-useQuotePreview'
import { QuoteStatusBadge } from '../48-pipeline-listado-cotizaciones/05-QuoteStatusBadge'

const t = tracer('QuotePreviewModal', 'src/50-pipeline-documento-cotizacion/01-QuotePreviewModal.tsx')

/** Vista previa del PDF de la cotización (visor compartido) + aviso por WhatsApp. */
export function QuotePreviewModal() {
  const p = useQuotePreview()
  if (!p) return null

  return (
    <PdfPreviewModal
      traceId={`quotes.preview.${p.quote.id}`}
      title={
        <>
          Cotización {p.quote.id} <QuoteStatusBadge status={p.status} />
        </>
      }
      subtitle={`${p.quote.customer.name} · ${formatCurrency(p.total)}`}
      pdf={p.pdf}
      filename={p.filename}
      onClose={p.onClose}
      footerStart={
        p.whatsappLink && (
          <a href={p.whatsappLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-whatsapp hover:underline flex items-center gap-1.5" {...t('quotes.preview.whatsapp')}>
            <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true" /> Avisar al cliente
          </a>
        )
      }
    />
  )
}
