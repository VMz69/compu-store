export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  client: string
  phone: string
  city: string
  /** Nombre del canal de venta (ej. "WhatsApp"). */
  channel: string
  /** Fecha local "YYYY-MM-DD HH:mm". */
  date: string
  total: number
  /** Nombre del estado operativo (ej. "Pendiente"). */
  status: string
  paymentMethod: string
  deliveryMethod: string
  items: OrderItem[]
  /**
   * Número de control de la factura que cerró el pedido; `null` si aún no se factura.
   * Lo asigna Facturación al emitir y lo limpia al anular.
   */
  invoiceId: string | null
}

export type OrderDraft = Omit<Order, 'id' | 'date' | 'invoiceId'>

export interface OrderStatus {
  id: string
  name: string
  /** Paso secuencial del pipeline; 0 = rama terminal de cancelación. */
  step: number
  /** Ícono FontAwesome (solo el nombre, ej. "fa-clock"). */
  icon: string
  color: string
  /** Clases completas del badge (light + dark). */
  badgeStyle: string
  description: string
  nextPossible: string[]
}

export interface Channel {
  id: string
  name: string
  badge: string
  /** Clase FontAwesome completa (ej. "fa-brands fa-whatsapp"). */
  icon: string
  color: string
  description: string
  active: boolean
}

export interface ChannelDraft {
  id?: string
  name: string
  badge: string
  icon: string
  description: string
  active: boolean
}

export interface OrderMetrics {
  total: number
  pending: number
  readyForPickup: number
  delivered: number
  revenue: number
  grossTotal: number
}
