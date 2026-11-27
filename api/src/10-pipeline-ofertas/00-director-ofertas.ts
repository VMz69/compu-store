// API pública del pipeline de ofertas (L12). Catálogo usa el precio efectivo; ofertas no importa catálogo.
export { crearRouterAdminOfertas } from './01-ofertas.routes.js'
export { hoyNegocio, precioEfectivo, sqlPrecioVigente, type PrecioEfectivo } from './05-precio-efectivo.js'
