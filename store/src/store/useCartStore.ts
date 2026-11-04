import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addItem as addCartItem,
  removeItem as removeCartItem,
  updateQuantity as updateCartQuantity,
} from '@/services/cart.service'
import type { CartItem, DeliveryMethod, Product } from '@/types'

/**
 * Estado persistido del carrito.
 *
 * El store solo orquesta; los cálculos y validaciones viven en
 * `services/cart.service.ts`. La clave de almacenamiento incluye versión (`v4`)
 * para poder migrar el formato sin romper sesiones existentes.
 */
interface CartStore {
  items: CartItem[]
  deliveryMethod: DeliveryMethod
  customerNote: string
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  setDeliveryMethod: (method: DeliveryMethod) => void
  setCustomerNote: (note: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMethod: 'pickup',
      customerNote: '',

      addItem: (product, quantity = 1) =>
        set({ items: addCartItem(get().items, product, quantity) }),

      updateQuantity: (productId, quantity) =>
        set({ items: updateCartQuantity(get().items, productId, quantity) }),

      removeItem: (productId) => set({ items: removeCartItem(get().items, productId) }),

      clearCart: () => set({ items: [], customerNote: '' }),

      setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),

      setCustomerNote: (customerNote) => set({ customerNote }),
    }),
    { name: 'compustore_sv_cart_v4' },
  ),
)
