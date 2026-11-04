import { useState } from 'react'
import { categories, products } from '@/data'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { useProductReviews } from '@/hooks/useProductReviews'
import { getAvailableStock } from '@/services/cart.service'
import { calculateDiscountPercentage } from '@/services/formatters'
import { getProductById, getRelatedProducts } from '@/services/catalog.service'
import { buildSingleProductUrl } from '@/services/whatsapp.service'
import { useCartStore } from '@/store/useCartStore'

/**
 * Compone la vista de detalle: producto, stock, cantidad, relacionados, reseñas y WhatsApp.
 */
export const useProductDetail = (productId?: string) => {
  const product = getProductById(products, Number(productId))
  const cartItems = useCartStore((state) => state.items)
  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const availableStock = product ? getAvailableStock(product, cartItems) : 0
  const relatedProducts = product ? getRelatedProducts(products, product, 4) : []
  const category = product ? categories.find((item) => item.slug === product.category) : undefined
  const { reviews } = useProductReviews(product?.id ?? 0)

  const productKey = product?.id ?? 0
  const maxQuantity = Math.max(1, availableStock)
  const quantity = Math.min(quantities[productKey] ?? 1, maxQuantity)

  const setQuantity = (next: number) =>
    setQuantities((current) => ({ ...current, [productKey]: Math.max(1, Math.min(next, maxQuantity)) }))

  const increment = () => setQuantity(quantity + 1)
  const decrement = () => setQuantity(quantity - 1)

  return {
    product,
    relatedProducts,
    availableStock,
    quantity,
    increment,
    decrement,
    reviewsCount: reviews.length,
    categoryLabel: category?.name ?? product?.category ?? '',
    categorySlug: product?.category ?? '',
    discount: product
      ? calculateDiscountPercentage(product.originalPrice, product.price)
      : 0,
    isFavorite: product ? isFavorite(product.id) : false,
    whatsappUrl: product ? buildSingleProductUrl(product, quantity) : '#',
    addToCart: () => product && addToCart(product, quantity),
    toggleFavorite: () => product && toggleFavorite(product),
  }
}
