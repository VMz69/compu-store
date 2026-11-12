import { Badge } from '@/00-director-interfaz'
import { QUOTE_STATUS_META } from '../51-pipeline-persistencia-cotizaciones/02-quote.service'
import type { QuoteStatus } from '../51-pipeline-persistencia-cotizaciones/03-types'

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const meta = QUOTE_STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  )
}
