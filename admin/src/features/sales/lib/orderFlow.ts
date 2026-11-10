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

/**
 * Lo ÚNICO configurable del flujo: el nombre visible y la descripción de cada estado
 * (Ajustes › Canales y flujo). Ids, orden, transiciones y efectos son fijos (código).
 * El store de ventas aplica aquí los textos guardados al cargar y al editarlos.
 */
export type StatusLabel = Pick<OrderStatus, 'name' | 'description'>
export type StatusLabels = Partial<Record<OrderStatusId, StatusLabel>>

let labels: StatusLabels = {}
export const applyStatusLabels = (next: StatusLabels): void => {
  labels = next
}

/** Estado con sus textos personalizados (si los hay). */
export const statusOf = (id: OrderStatusId): OrderStatus => {
  const base = BY_ID[id] ?? BY_ID.registrado
  const custom = labels[base.id]
  return custom ? { ...base, ...custom } : base
}

/** Todos los estados en orden del flujo (cancelado al final), con textos personalizados. */
export const flowStatuses = (): OrderStatus[] =>
  [...ORDER_STATUSES].sort((a, b) => (a.step || 99) - (b.step || 99)).map((s) => statusOf(s.id))

export function validateStatusLabel(id: OrderStatusId, v: StatusLabel): Record<string, string> {
  const e: Record<string, string> = {}
  const name = v.name.trim()
  if (name.length < 3 || name.length > 30) e.name = 'Usa entre 3 y 30 caracteres.'
  else if (ORDER_STATUSES.some((s) => s.id !== id && statusOf(s.id).name.toLowerCase() === name.toLowerCase())) e.name = 'Otro estado ya usa ese nombre.'
  if (v.description.trim().length > 200) e.description = 'Máximo 200 caracteres.'
  return e
}

export const isOrderStatusId = (value: string): value is OrderStatusId => value in BY_ID

export const canTransition = (from: OrderStatusId, to: OrderStatusId): boolean => statusOf(from).next.includes(to)

/** Estado que aparta inventario. */
export const RESERVING_STATUS: OrderStatusId = 'confirmado'

/** Estados que cuentan como venta efectiva (ya facturada). */
export const SOLD_STATUSES: OrderStatusId[] = ['facturado', 'entregado']

/** Estados en curso (aún requieren una acción del equipo). */
export const ACTIVE_STATUSES: OrderStatusId[] = ['registrado', 'confirmado', 'facturado']

export const isInvoiceable = (order: Order): boolean => order.status === 'confirmado' && !order.invoiceId

/**
 * Regla de edición: un pedido se puede editar mientras no tenga factura
 * (Registrado o Confirmado y Listo). Facturado/Entregado tienen un documento
 * fiscal emitido y Cancelado es terminal.
 */
export const EDITABLE_STATUSES: OrderStatusId[] = ['registrado', 'confirmado']

/** Motivo por el que el pedido no se puede editar, o null si sí se puede. */
export function editBlockedReason(order: Order | undefined): string | null {
  if (!order) return 'El pedido no existe o fue eliminado.'
  if (order.invoiceId) return `El pedido ya tiene la factura ${order.invoiceId}. Para corregirlo, anula la factura primero.`
  if (!EDITABLE_STATUSES.includes(order.status)) return `Un pedido en estado "${statusOf(order.status).name}" ya no se puede editar.`
  return null
}

export const isEditable = (order: Order): boolean => editBlockedReason(order) === null

/**
 * Regla de eliminación (lógica): solo pedidos SIN factura (Registrado, Confirmado y
 * Listo o Cancelado). Un pedido facturado o entregado tiene un documento fiscal
 * emitido y debe conservarse; para corregirlo se anula la factura.
 */
export function deleteBlockedReason(order: Order | undefined): string | null {
  if (!order) return 'El pedido no existe o ya fue eliminado.'
  if (order.invoiceId) return `El pedido tiene la factura ${order.invoiceId}: no se puede eliminar. Anula la factura primero.`
  if (order.status === 'facturado' || order.status === 'entregado') return `Un pedido "${statusOf(order.status).name}" no se puede eliminar.`
  return null
}

export const isDeletable = (order: Order): boolean => deleteBlockedReason(order) === null

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
