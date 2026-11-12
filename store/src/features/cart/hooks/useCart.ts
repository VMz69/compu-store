import { useCallback, useMemo } from 'react'
import { calculateItemCount, calculateSubtotal } from '../lib/cart.service'
import { useCartStore } from '../store'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import type { Product } from '@/00-director-modelos'

/**
 * Acciones y totales del carrito para componentes de producto y header.
 * Convierte los errores de stock del servicio en notificaciones legibles.
 */
export const useCart = () => {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const pushToast = useToastStore((state) => state.pushToast)

  const count = useMemo(() => calculateItemCount(items), [items])
  const subtotal = useMemo(() => calculateSubtotal(items), [items])

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      try {
        addItem(product, quantity)
        pushToast(`¡${product.name} agregado al carrito!`, 'success')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo agregar el producto.'
        pushToast(message, 'warning')
      }
    },
    [addItem, pushToast],
  )

  return { items, count, subtotal, addToCart }
}
