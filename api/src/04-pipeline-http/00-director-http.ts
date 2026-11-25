// API pública del pipeline HTTP.
export { validar } from './01-validacion.middleware.js'
export { ErrorApp, manejarErrores, noEncontrado, type CodigoError } from './02-errores.middleware.js'
export { autenticacion, identidadDe } from './03-autenticacion.middleware.js'
export { esquemaPaginacion, meta, rango, type MetaPaginacion, type Paginacion } from './04-paginacion.js'
