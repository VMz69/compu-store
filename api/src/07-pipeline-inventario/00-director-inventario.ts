// API pública del pipeline de inventario.
export { crearRouterAdminInventario } from './01-inventario.routes.js'
export { esquemaLotes } from './02-inventario.schema.js'
export { obtenerDisponibilidad, registrarExistenciasIniciales, type ExistenciasIniciales } from './03-inventario.service.js'
