// API pública del feature `cart`. Desde fuera solo se importa este archivo.
export { CartWidget } from './features/cart/components/CartWidget'
export { useCart } from './features/cart/hooks/useCart'
export { getAvailableStock } from './features/cart/lib/cart.service'
export { CartView } from './features/cart/pages/CartView'
export { useCartStore } from './features/cart/store'
export type { CartItem, CartTotals, CheckoutState, DeliveryMethod } from './features/cart/types'
