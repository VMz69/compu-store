// API pública del pipeline de facturación (L15–L16). El seed emite con la misma operación que la API.
export { crearRouterFacturas } from './01-facturas.routes.js'
export { emitirEnTx } from './03-facturas.service.js'
export { transaccion } from './04-facturas.repository.js'
// L16: cotizaciones toma su número de la misma tabla de correlativos (D-12).
export { siguiente as siguienteCorrelativo } from './05-correlativos.js'
