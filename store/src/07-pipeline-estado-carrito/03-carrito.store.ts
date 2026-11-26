import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addItem as addCartItem,
  removeItem as removeCartItem,
  updateQuantity as updateCartQuantity,
} from './02-calculos-carrito'
import type { Product } from '@/00-director-modelos'
import type { CartItem, DeliveryMethod, ValidatedCartLine } from './01-modelos-carrito'

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
  /** Al arrancar: descarta en silencio los productos que ya no existen y refresca la copia de los demás. */
  purgeUnknown: (catalog: Product[]) => void
  /**
   * Aplica la validación del servidor: precio, nombre y existencias vigentes; recorta
   * las líneas ajustadas y retira las agotadas o no disponibles.
   */
  applyValidation: (lines: ValidatedCartLine[]) => void
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

      purgeUnknown: (catalog) => {
        const byId = new Map(catalog.map((product) => [product.id, product]))
        set({
          items: get().items.flatMap((item) => {
            const product = byId.get(item.product.id)
            return product ? [{ ...item, product }] : []
          }),
        })
      },

      applyValidation: (lines) => {
        const byId = new Map(lines.map((line) => [line.productId, line]))
        set({
          items: get().items.flatMap((item) => {
            const line = byId.get(item.product.id)
            if (!line) return [item] // agregado mientras se validaba: se valida en la siguiente ronda
            if (line.unitPrice === null || line.available <= 0) return []
            return [
              {
                product: { ...item.product, name: line.name ?? item.product.name, price: line.unitPrice, stock: line.available },
                quantity: Math.min(item.quantity, line.available),
              },
            ]
          }),
        })
      },
    }),
    { name: 'compustore_sv_cart_v4' },
  ),
)
