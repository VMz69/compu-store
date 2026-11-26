import { useState } from 'react'
import { categories } from '@/38-pipeline-datos-api/00-director-datos-api'
import { products } from '@/38-pipeline-datos-api/00-director-datos-api'
import { getAvailableStock, useCart, useCartStore } from '@/00-director-carrito'
import { useFavorites } from '@/15-pipeline-preferencias-producto/00-director-preferencias-producto'
import { useProductReviews } from '@/20-pipeline-estado-resenas/00-director-estado-resenas'
import { calculateDiscountPercentage } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { getProductById, getProductImages, getRelatedProducts } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'
import { buildSingleProductUrl, useProductWhatsAppValidation } from '@/24-pipeline-compra-producto/00-director-compra-producto'

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

  // La compra directa por WhatsApp usa el precio y la cantidad que confirma el servidor (L07).
  const { purchase } = useProductWhatsAppValidation(product, quantity)

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
    whatsappUrl:
      product && purchase
        ? buildSingleProductUrl({ ...product, price: purchase.price }, purchase.quantity)
        : '#',
    addToCart: () => product && addToCart(product, quantity),
    toggleFavorite: () => product && toggleFavorite(product),
  }
}
