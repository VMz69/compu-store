// API pública del pipeline de pedidos (L13–L16). El seed usa el mismo cálculo de importes y la misma reserva que la API.
export { crearRouterAjustesVentas } from './01-ajustes-ventas.routes.js'
export { crearRouterPedidos } from './06-pedidos.routes.js'
export { importeLinea, totalPedido } from './10-totales.js'
export { barrerReservasVencidas, conectarReservas, iniciarBarridoReservas, reservarEnTx } from './11-reservas.service.js'
export {
  bloquearParaAnular,
  marcarFacturado,
  tomarParaFacturar,
  volverAReservado,
  type PedidoParaFacturar,
} from './12-facturacion-pedido.service.js'
export { idVisible, type OperadorReserva } from './11-reservas.service.js'
// L16: cotizaciones convierte con la misma validación y las mismas reglas que el registro.
export { esquemaCargo, esquemaClienteOcasional, esquemaLinea, esquemaPedido, type DatosPedido } from './07-pedidos.schema.js'
export { crearDesdeCotizacion, obtenerPedido, type OrigenCotizacion, type PedidoDto } from './08-pedidos.service.js'
// L18: métricas para reportes (tablero e historial de clientes), calculadas en la BD.
export { ESTADOS_VENDIDOS, estadisticasPorCliente, totalesPorEstado, type FilaCliente, type FilaEstado } from './13-metricas.repository.js'
