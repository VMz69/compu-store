// API pública del feature `quotes` (/cotizaciones). Desde fuera solo se importa este archivo.
export { QuotePreviewModal } from './50-pipeline-documento-cotizacion/00-director-documento-cotizacion'
export { QUOTES_MODALS } from './50-pipeline-documento-cotizacion/04-modals'
export { NewQuotePage } from './49-pipeline-preparacion-cotizaciones/00-director-preparacion-cotizaciones'
export { QuotesPage } from './48-pipeline-listado-cotizaciones/00-director-listado-cotizaciones'
export { useQuotesStore } from './51-pipeline-persistencia-cotizaciones/00-director-persistencia-cotizaciones'
export type { Quote, QuoteStatus } from './51-pipeline-persistencia-cotizaciones/03-types'
