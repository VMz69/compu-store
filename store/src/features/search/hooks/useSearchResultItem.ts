import { getAvailableStock, useCartStore } from '@/features/cart'
import { calculateDiscountPercentage } from '@/shared/lib/formatters'
import type { Product } from '@/shared/types'

/** Estado derivado de una fila del desplegable: oferta, descuento y disponibilidad en carrito. */
export const useSearchResultItem = (product: Product) => {
  const cartItems = useCartStore((state) => state.items)

  const isOffer = Boolean(product.originalPrice) && product.originalPrice! > product.price
  const discount = calculateDiscountPercentage(product.originalPrice, product.price)
  const inCart = cartItems.some((item) => item.product.id === product.id)
  const canAdd = product.stock > 0 && getAvailableStock(product, cartItems) > 0

  return { isOffer, discount, inCart, canAdd }
}
