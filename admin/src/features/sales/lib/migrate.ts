import type { Order, OrderStatusId } from '../types'
import { isOrderStatusId } from './orderFlow'
import { reservationBounds } from './reservation'

/** Estados del modelo anterior (texto libre) → estados del flujo actual. */
const LEGACY_STATUS: Record<string, OrderStatusId> = {
  Pendiente: 'registrado',
  Confirmado: 'confirmado',
  'Listo para Retiro': 'confirmado',
  Entregado: 'entregado',
  Cancelado: 'cancelado',
}

type LegacyItem = { productId: string; name: string; quantity: number; price?: number; unitPrice?: number; sku?: string; discountPercent?: number }
type LegacyOrder = Partial<Omit<Order, 'items' | 'status'>> & { id: string; status: string; items?: LegacyItem[] }

/** Fecha local "YYYY-MM-DD HH:mm" → ISO (para el historial). */
const toIso = (stamp: string | undefined): string => {
  const date = stamp ? new Date(stamp.replace(' ', 'T')) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

/**
 * Convierte un pedido guardado con el modelo v1 (estados en texto, un solo
 * precio por línea, sin cliente enlazado) y v2 (sin cargos extra) al modelo actual. Idempotente.
 */
export function migrateOrder(raw: LegacyOrder): Order {
  let status: OrderStatusId = isOrderStatusId(raw.status) ? raw.status : (LEGACY_STATUS[raw.status] ?? 'registrado')
  // Antes, facturar pasaba el pedido directo a "Entregado"; un pedido con factura y aún
  // en un estado previo pasa a "Facturado".
  if (raw.invoiceId && (status === 'registrado' || status === 'confirmado')) status = 'facturado'
  const items = (raw.items ?? []).map((i) => ({
    productId: i.productId,
    sku: i.sku ?? i.productId,
    name: i.name,
    quantity: i.quantity,
    unitPrice: i.unitPrice ?? i.price ?? 0,
    discountPercent: i.discountPercent ?? 0,
  }))
  return {
    customerId: null,
    client: '',
    phone: '',
    email: '',
    city: '',
    channel: '',
    date: '',
    total: items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    paymentMethod: '',
    deliveryMethod: '',
    notes: '',
    invoiceId: null,
    quoteId: null,
    ...raw,
    status,
    items,
    // v3: los pedidos anteriores no tenían cargos extra (su total ya era el de los productos).
    charges: raw.charges ?? [],
    // v4: los pedidos ya reservados reciben la vigencia por defecto (no vencen al migrar).
    reservedUntil: status === 'confirmado' ? (raw.reservedUntil ?? reservationBounds().suggested) : null,
    history: raw.history?.length ? raw.history : [{ status, at: toIso(raw.date), by: 'Migración de datos' }],
  }
}
