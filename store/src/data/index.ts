/**
 * Punto único de acceso a los datos estáticos del front-office.
 *
 * Los componentes y hooks importan siempre desde `@/data`, nunca desde archivos
 * concretos. Cuando el catálogo pase a una API, este barrel será el único lugar
 * que cambie (o se convertirá en un repositorio asíncrono).
 */
export { STORE_CONFIG } from './storeConfig'
export { categories } from './categories'
export { brands } from './brands'
export { promotions } from './promotions'
export { products } from './products'
export { DEFAULT_REVIEWS, INITIAL_REVIEWS } from './reviews'
export { CONTACT_SUBJECTS, FOOTER_LINKS, SORT_OPTIONS, TRUST_PILLARS } from './uiOptions'
