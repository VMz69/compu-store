// API pública del pipeline de datos de la API (D-14): cliente, adaptadores, catálogo reactivo,
// precarga, validación del carrito y refresco al navegar.
export { ApiError } from './01-cliente-api'
export { useCatalogStore, useProducts, useCategories, useBrands } from './03-catalogo.datos'
export { precargar } from './04-precarga'
export { validarCarrito } from './05-carrito.api'
export { iniciarRefresco, refrescar } from './06-refresco'
