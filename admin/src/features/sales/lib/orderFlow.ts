import type { Order, OrderStatus, OrderStatusId } from '../types'

/**
 * Máquina de estados del pedido (regla de negocio; no es configurable como dato).
 *
 *   Registrado ──► Confirmado y Listo ──► Facturado ──► Entregado
 *        │                 │    ▲              │
 *        └──► Cancelado ◄──┘    └── anular ────┘
 *
 * - Confirmar RESERVA el stock (disponible = stock − reservado).
 * - Facturar (solo desde Facturación) descuenta inventario y emite el DTE.
 * - Anular la factura devuelve el pedido a "Confirmado y Listo" (re-reserva).
 * - Un pedido facturado no se cancela: primero se anula su factura.
 */
export const ORDER_STATUSES: OrderStatus[] = [
  {
    id: 'registrado', name: 'Registrado', step: 1, icon: 'fa-clipboard-list',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    description: 'Orden capturada (mostrador, WhatsApp, web o cotización convertida). Pendiente de validar pago o crédito.',
    effect: 'Sin efecto en inventario. Se valida que haya stock disponible al registrar.',
    trigger: 'Pedidos › Nuevo pedido o Cotizaciones › Convertir',
    next: ['confirmado', 'cancelado'],
  },
  {
    id: 'confirmado', name: 'Confirmado y Listo', step: 2, icon: 'fa-box-open',
    badgeStyle: 'bg-blue-50 text-brand border-brand/30 dark:bg-brand-950/50 dark:text-blue-300 dark:border-brand-800',
    description: 'Pago o crédito validado y mercadería apartada y embalada, lista para facturar y entregar en mostrador o envío.',
    effect: 'Reserva el stock: las unidades dejan de estar disponibles para otros pedidos.',
    trigger: 'Pedidos › Confirmar (o anular la factura en Facturación)',
    next: ['facturado', 'cancelado'],
  },
  {
    id: 'facturado', name: 'Facturado', step: 3, icon: 'fa-file-invoice-dollar',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description: 'DTE emitido. La mercadería salió del inventario y espera ser entregada al cliente.',
    effect: 'Descuenta el inventario (por lotes FEFO) y libera la reserva.',
    trigger: 'Facturación › Emitir factura',
    next: ['entregado'],
  },
  {
    id: 'entregado', name: 'Entregado', step: 4, icon: 'fa-circle-check',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    description: 'Mercadería recibida a conformidad por el cliente. Transacción cerrada.',
    effect: 'Cierra el ciclo. La factura ya no se puede anular desde el flujo normal.',
    trigger: 'Pedidos › Marcar entregado',
    next: [],
  },
  {
    id: 'cancelado', name: 'Cancelado', step: 0, icon: 'fa-ban',
    badgeStyle: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
    description: 'Orden anulada por solicitud del cliente, falta de pago o inconsistencia en inventario.',
    effect: 'Libera la reserva de stock. Si venía de una cotización, esta puede volver a convertirse.',
    trigger: 'Pedidos › Cancelar (solo antes de facturar)',
    next: [],
  },
]

const BY_ID = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s])) as Record<OrderStatusId, OrderStatus>

export const statusOf = (id: OrderStatusId): OrderStatus => BY_ID[id] ?? BY_ID.registrado

export const isOrderStatusId = (value: string): value is OrderStatusId => value in BY_ID

export const canTransition = (from: OrderStatusId, to: OrderStatusId): boolean => statusOf(from).next.includes(to)

/** Estado que aparta inventario. */
export const RESERVING_STATUS: OrderStatusId = 'confirmado'

/** Estados que cuentan como venta efectiva (ya facturada). */
export const SOLD_STATUSES: OrderStatusId[] = ['facturado', 'entregado']

/** Estados en curso (aún requieren una acción del equipo). */
export const ACTIVE_STATUSES: OrderStatusId[] = ['registrado', 'confirmado', 'facturado']

export const isInvoiceable = (order: Order): boolean => order.status === 'confirmado' && !order.invoiceId

/** Acciones manuales desde Pedidos. "Facturar" vive en Facturación. */
export type OrderAction = 'confirm' | 'invoice' | 'deliver' | 'cancel'

export const ACTION_TARGET: Record<Exclude<OrderAction, 'invoice'>, OrderStatusId> = {
  confirm: 'confirmado',
  deliver: 'entregado',
  cancel: 'cancelado',
}

/** Acciones disponibles según el estado actual. */
export function availableActions(order: Order): OrderAction[] {
  switch (order.status) {
    case 'registrado':
      return ['confirm', 'cancel']
    case 'confirmado':
      return ['invoice', 'cancel']
    case 'facturado':
      return ['deliver']
    default:
      return []
  }
}
