// API pública del feature `cart`. Desde fuera solo se importa este archivo.
export { CartWidget } from './components/CartWidget'
export { useCart } from './hooks/useCart'
export { getAvailableStock } from './lib/cart.service'
export { CartView } from './pages/CartView'
export { useCartStore } from './store'
export type { CartItem, CartTotals, CheckoutState, DeliveryMethod } from './types'
