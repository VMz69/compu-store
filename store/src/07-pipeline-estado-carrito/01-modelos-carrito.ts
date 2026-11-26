import type { Product } from '@/00-director-modelos'

export type DeliveryMethod = 'pickup' | 'shipping'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CheckoutState {
  deliveryMethod: DeliveryMethod
  customerNote: string
}

export interface CartTotals {
  itemCount: number
  subtotal: number
  total: number
}

/** Resultado del servidor por línea (POST /tienda/carrito/validar, L07B). */
export type CartLineStatus = 'ok' | 'adjusted' | 'sold-out' | 'unavailable'

export interface ValidatedCartLine {
  productId: number
  /** null si el producto ya no existe. */
  name: string | null
  /** Precio vigente del servidor; null si el producto no está disponible. */
  unitPrice: number | null
  available: number
  status: CartLineStatus
}
