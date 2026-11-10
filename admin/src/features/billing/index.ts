// API pública del feature `billing` (/facturacion). Desde fuera solo se importa este archivo.
import { provideLastInvoiceNumber } from '@/features/settings'
import { useLastIssuedInvoiceNumber } from './hooks/useBilling'

// Ajustes › Identidad muestra el último correlativo emitido (sin importar este feature).
provideLastInvoiceNumber(useLastIssuedInvoiceNumber)

export { InvoiceEmitModal } from './components/emit/InvoiceEmitModal'
export { InvoicePreviewModal } from './components/preview/InvoicePreviewModal'
export { BILLING_MODALS } from './modals'
export { BillingPage } from './pages/BillingPage'
export { useBillingStore } from './store'
export type { Invoice, InvoiceStatus } from './types'
