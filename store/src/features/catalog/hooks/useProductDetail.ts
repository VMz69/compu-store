import { useState } from 'react'
import { categories } from '../mocks/categories.mock'
import { products } from '../mocks/products.mock'
import { getAvailableStock, useCart, useCartStore } from '@/00-director-carrito'
import { useFavorites } from './useFavorites'
import { useProductReviews } from './useProductReviews'
import { calculateDiscountPercentage } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { getProductById, getProductImages, getRelatedProducts } from '../lib/catalog.service'
import { buildSingleProductUrl } from '../lib/whatsapp'

/**
 * Compone la vista de detalle: producto, galería, stock, cantidad, relacionados, reseñas y WhatsApp.
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
    images: product ? getProductImages(product) : [],
    relatedProducts,
    availableStock,
    quantity,
    subtotal: product ? product.price * quantity : 0,
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
