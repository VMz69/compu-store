import { useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { calculateDiscountPercentage } from '@/services/formatters'
import { getAvailableStock } from '@/services/cart.service'
import { useCartStore } from '@/store/useCartStore'
import type { Product } from '@/types'

/**
 * Estado y acciones de una tarjeta de producto (stock, descuento, carrito y favoritos).
 */
export const useProductCard = (product: Product) => {
  const navigate = useNavigate()
  const cartItems = useCartStore((state) => state.items)
  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  const availableStock = getAvailableStock(product, cartItems)
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 2
  const discount = calculateDiscountPercentage(product.originalPrice, product.price)

  return {
    availableStock,
    isOutOfStock,
    isLowStock,
    discount,
    isFavorite: isFavorite(product.id),
    goToDetail: () => navigate(`/product/${product.id}`),
    addToCart: () => addToCart(product, 1),
    toggleFavorite: () => toggleFavorite(product),
  }
}
