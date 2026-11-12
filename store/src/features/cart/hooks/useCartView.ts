import { useState } from 'react'
import { buildCartCheckoutUrl } from '../lib/whatsapp'
import { calculateItemCount, calculateSubtotal } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { useCartStore } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import type { CartItem } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'

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
