import { useState } from 'react'
import { buildCartCheckoutUrl } from '@/services/whatsapp.service'
import { calculateItemCount, calculateSubtotal } from '@/services/cart.service'
import { useCartStore } from '@/store/useCartStore'
import { useToastStore } from '@/store/useToastStore'
import type { CartItem } from '@/types'

/**
 * Vista del carrito: líneas, totales, métodos de entrega y checkout por WhatsApp.
 */
export const useCartView = () => {
  const items = useCartStore((state) => state.items)
  const deliveryMethod = useCartStore((state) => state.deliveryMethod)
  const customerNote = useCartStore((state) => state.customerNote)
  const setDeliveryMethod = useCartStore((state) => state.setDeliveryMethod)
  const setCustomerNote = useCartStore((state) => state.setCustomerNote)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCartStore = useCartStore((state) => state.clearCart)
  const pushToast = useToastStore((state) => state.pushToast)

  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  const increment = (item: CartItem) => updateQuantity(item.product.id, item.quantity + 1)
  const decrement = (item: CartItem) => updateQuantity(item.product.id, item.quantity - 1)
  const remove = (item: CartItem) => {
    removeItem(item.product.id)
    pushToast('Producto eliminado del carrito', 'info')
  }
  const requestClearCart = () => setIsClearModalOpen(true)
  const cancelClearCart = () => setIsClearModalOpen(false)
  const confirmClearCart = () => {
    clearCartStore()
    pushToast('Carrito vaciado correctamente', 'info')
    setIsClearModalOpen(false)
  }

  const subtotal = calculateSubtotal(items)
  return {
    items,
    itemCount: calculateItemCount(items),
    subtotal,
    total: subtotal,
    deliveryMethod,
    customerNote,
    setDeliveryMethod,
    setCustomerNote,
    increment,
    decrement,
    remove,
    requestClearCart,
    confirmClearCart,
    cancelClearCart,
    isClearModalOpen,
    whatsappUrl:
      items.length > 0 ? buildCartCheckoutUrl(items, deliveryMethod, customerNote) : '#',
  }
}
