// API pública del pipeline de clientes (L11). Pedidos (L13) toma de aquí el cliente para su snapshot.
export { crearRouterClientes } from './01-clientes.routes.js'
export { obtenerClienteParaPedido, type ClienteParaPedido } from './03-clientes.service.js'
