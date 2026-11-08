import { Badge } from '@/shared/ui'
import { QUOTE_STATUS_META } from '../lib/quote.service'
import type { QuoteStatus } from '../types'

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const meta = QUOTE_STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  )
}
