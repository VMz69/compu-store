// API pública del feature `quotes` (/cotizaciones). Desde fuera solo se importa este archivo.
export { QuotePreviewModal } from './features/quotes/components/preview/QuotePreviewModal'
export { QUOTES_MODALS } from './features/quotes/modals'
export { NewQuotePage } from './features/quotes/pages/NewQuotePage'
export { QuotesPage } from './features/quotes/pages/QuotesPage'
export { useQuotesStore } from './features/quotes/store'
export type { Quote, QuoteStatus } from './features/quotes/types'
