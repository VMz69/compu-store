// API pública del pipeline de catálogo.
export { crearRouterAdminTaxonomia, crearRouterTiendaTaxonomia } from './01-taxonomia.routes.js'
export { crearRouterAdminProductos, crearRouterTiendaProductos } from './05-productos.routes.js'
export { obtenerProductosVendibles, type ProductoVendible } from './07-productos.service.js'
