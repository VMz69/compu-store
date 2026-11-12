// API pública del feature `cart`. Desde fuera solo se importa este archivo.
export { CartWidget } from './features/cart/components/CartWidget'
export { useCart } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
export { getAvailableStock } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
export { CartView } from './features/cart/pages/CartView'
export { useCartStore } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
export type { CartItem, CartTotals, CheckoutState, DeliveryMethod } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
