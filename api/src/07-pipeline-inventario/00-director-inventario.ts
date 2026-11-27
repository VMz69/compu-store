// API pública del pipeline de inventario.
export { crearRouterAdminInventario } from './01-inventario.routes.js'
export { esquemaLotes } from './02-inventario.schema.js'
export { obtenerDisponibilidad, registrarExistenciasIniciales, type ExistenciasIniciales } from './03-inventario.service.js'
export {
  liberar,
  liberarVencidas,
  moverReserva,
  registrarPuertoReservas,
  reservar,
  type Faltante,
  type LineaReserva,
  type PuertoReservas,
  type Reservante,
} from './06-reservas.service.js'
export { descontar, reponer, type ConsumoLote, type ConsumoVenta, type ContextoMovimiento, type LineaVenta } from './07-ventas.service.js'
