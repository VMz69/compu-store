import { useNavigate } from 'react-router-dom'
import { getAvailableStock, useCart, useCartStore } from '@/00-director-carrito'
import { useFavorites } from '@/15-pipeline-preferencias-producto/00-director-preferencias-producto'
import { calculateDiscountPercentage } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import type { Product } from '@/00-director-modelos'

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
