import { getAvailableStock, useCartStore } from '@/00-director-carrito'
import { calculateDiscountPercentage } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import type { Product } from '@/00-director-modelos'

/** Estado derivado de una fila del desplegable: oferta, descuento y disponibilidad en carrito. */
export const useSearchResultItem = (product: Product) => {
  const cartItems = useCartStore((state) => state.items)

  const isOffer = Boolean(product.originalPrice) && product.originalPrice! > product.price
  const discount = calculateDiscountPercentage(product.originalPrice, product.price)
  const inCart = cartItems.some((item) => item.product.id === product.id)
  const canAdd = product.stock > 0 && getAvailableStock(product, cartItems) > 0

  return { isOffer, discount, inCart, canAdd }
}
