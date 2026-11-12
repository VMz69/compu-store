import type { ExtraCharge } from '@/78-pipeline-cargos-documentos/03-charges'

/**
 * Estados del flujo de pedidos (ver `lib/orderFlow.ts`):
 * registrado → confirmado ("Reservado", con vigencia) → facturado → entregado · cancelado (terminal).
 * Una reserva vencida devuelve el pedido a registrado.
 */
export type OrderStatusId = 'registrado' | 'confirmado' | 'facturado' | 'entregado' | 'cancelado'

/** Línea del pedido. Copia SKU, nombre y precio: si el catálogo cambia, el pedido no. */
export interface OrderItem {
  productId: string
  sku: string
  name: string
  quantity: number
  /** Precio unitario con IVA incluido al registrar (o el cotizado). */
  unitPrice: number
  /** Descuento por línea, 0–100. */
  discountPercent: number
}

/**
 * Cargo adicional al pago del pedido que no sale del inventario (envío, instalación,
 * configuración…). Suma al total y se factura como línea de servicio.
 */
export type OrderCharge = ExtraCharge

/** Evento del historial (trazabilidad: quién movió el pedido y cuándo). */
export interface OrderEvent {
  status: OrderStatusId
  /** Fecha ISO. */
  at: string
  by: string
  note?: string
}

export interface Order {
  id: string
  /** Cliente del directorio; `null` = cliente ocasional. */
  customerId: string | null
  client: string
  phone: string
  email: string
  city: string
  /** Nombre del canal de venta (ej. "WhatsApp"). */
  channel: string
  /** Fecha local "YYYY-MM-DD HH:mm". */
  date: string
  /** Total con descuentos, cargos extra e IVA incluido (snapshot al registrar). */
  total: number
  status: OrderStatusId
  paymentMethod: string
  deliveryMethod: string
  notes: string
  items: OrderItem[]
  /** Cargos extra (no son productos: no reservan ni descuentan stock). */
  charges: OrderCharge[]
  /**
   * Fecha límite de la reserva "YYYY-MM-DD" (inclusive). Solo aplica en estado
   * "confirmado" (Reservado); null en los demás. Ver `lib/reservation.ts`.
   */
  reservedUntil: string | null
  /** Factura que cerró la venta; la asigna Facturación al emitir y la limpia al anular. */
  invoiceId: string | null
  /** Cotización de origen, si el pedido se convirtió desde una. */
  quoteId: string | null
  history: OrderEvent[]
}

/**
 * Pedido eliminado. ⚠️ Eliminación LÓGICA: el registro no se borra; se mueve a la
 * colección `deletedOrders` del store con quién, cuándo y por qué, para auditoría.
 * Al salir de `orders` deja de contar en listados, métricas, reservas de stock y
 * facturación, y su id nunca se reutiliza.
 */
export interface DeletedOrder extends Order {
  /** Fecha ISO de eliminación. */
  deletedAt: string
  deletedBy: string
  deleteReason: string
}

/** Datos para registrar: el store asigna id, fecha, total, estado inicial e historial. */
export type OrderDraft = Omit<Order, 'id' | 'date' | 'total' | 'status' | 'invoiceId' | 'history' | 'reservedUntil'>

/** Pre-carga del constructor de pedidos (ej. al convertir una cotización). */
export interface OrderPrefill {
  quoteId: string | null
  customer: { customerId: string | null; name: string; phone: string; email: string }
  items: OrderItem[]
  /** Cargos extra cotizados: pasan al pedido. */
  charges?: OrderCharge[]
  notes: string
}

export interface OrderStatus {
  id: OrderStatusId
  name: string
  /** Paso secuencial del flujo; 0 = rama terminal de cancelación. */
  step: number
  /** Ícono FontAwesome (solo el nombre, ej. "fa-clock"). */
  icon: string
  /** Clases completas del badge (light + dark). */
  badgeStyle: string
  description: string
  /** Efecto del estado sobre otros módulos (inventario, facturación…). */
  effect: string
  /** Quién o qué lleva el pedido a este estado. */
  trigger: string
  next: OrderStatusId[]
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
  registered: number
  confirmed: number
  invoiced: number
  delivered: number
  cancelled: number
  /** Pedidos en curso (registrados, confirmados o facturados sin entregar). */
  active: number
  /** Venta efectiva: pedidos facturados o entregados. */
  revenue: number
}
