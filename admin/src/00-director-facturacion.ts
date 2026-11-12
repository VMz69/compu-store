// API pública del feature `billing` (/facturacion). Desde fuera solo se importa este archivo.
import { provideLastInvoiceNumber } from '@/00-director-ajustes'
import { useLastIssuedInvoiceNumber } from './44-pipeline-listado-facturacion/02-useBilling'

// Ajustes › Identidad muestra el último correlativo emitido (sin importar este feature).
provideLastInvoiceNumber(useLastIssuedInvoiceNumber)

export { InvoiceEmitModal } from './45-pipeline-emision-facturas/00-director-emision-facturas'
export { InvoicePreviewModal } from './46-pipeline-documento-factura/00-director-documento-factura'
export { BILLING_MODALS } from './45-pipeline-emision-facturas/05-modals'
export { BillingPage } from './44-pipeline-listado-facturacion/00-director-listado-facturacion'
export { useBillingStore } from './47-pipeline-persistencia-facturas/00-director-persistencia-facturas'
export type { Invoice, InvoiceStatus } from './47-pipeline-persistencia-facturas/03-types'
