// API pública del feature `billing` (/facturacion). Desde fuera solo se importa este archivo.
import { provideLastInvoiceNumber } from '@/00-director-ajustes'
import { useLastIssuedInvoiceNumber } from './features/billing/hooks/useBilling'

// Ajustes › Identidad muestra el último correlativo emitido (sin importar este feature).
provideLastInvoiceNumber(useLastIssuedInvoiceNumber)

export { InvoiceEmitModal } from './features/billing/components/emit/InvoiceEmitModal'
export { InvoicePreviewModal } from './features/billing/components/preview/InvoicePreviewModal'
export { BILLING_MODALS } from './features/billing/modals'
export { BillingPage } from './features/billing/pages/BillingPage'
export { useBillingStore } from './features/billing/store'
export type { Invoice, InvoiceStatus } from './features/billing/types'
