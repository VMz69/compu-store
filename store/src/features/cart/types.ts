import type { Product } from './product.types'

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
