import { Badge } from '@/00-director-interfaz'
import { INVOICE_STATUS_META } from '../lib/invoice.service'
import type { InvoiceStatus } from '../types'

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = INVOICE_STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  )
}
