import { Badge } from '@/00-director-interfaz'
import { INVOICE_STATUS_META } from '../47-pipeline-persistencia-facturas/02-invoice.service'
import type { InvoiceStatus } from '../47-pipeline-persistencia-facturas/03-types'

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = INVOICE_STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  )
}
