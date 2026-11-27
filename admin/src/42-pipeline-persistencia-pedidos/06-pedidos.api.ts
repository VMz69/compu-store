import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import { nowStamp } from './02-order.service'
import type { StatusLabels } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import type { Channel, ChannelDraft, Order, OrderDraft, OrderStatusId } from './05-types'

/**
 * Adaptador de pedidos, canales y etiquetas de estado (L13): `/admin/pedidos`, `/admin/canales-venta`
 * y `/admin/estados-pedido` ↔ tipos del admin (D-14, D-19). El servidor fija precios, importes,
 * totales e historial; aquí solo se traduce. Ids: `ORD-AAAA-###`, `CLI-###`, `PRD-###` (D-04).
 */

interface PedidoDto {
  id: number
  cliente: { id: number | null; nombre: string; telefono: string; correo: string }
  ciudad: string
  canal: { id: number; nombre: string }
  formaPago: string
  formaEntrega: string
  notas: string
  estado: OrderStatusId
  reservadoHasta: string | null
  /** Factura activa (L15); null si no tiene o si se anuló. */
  factura: { id: number; numeroControl: string; correlativo: number } | null
  lineas: { productoId: number; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { id: number; concepto: string; monto: string }[]
  total: string
  creadoEn: string
  historial: { estado: OrderStatusId; fecha: string; por: string; nota: string | null }[]
}

interface CanalDto {
  id: number
  nombre: string
  insignia: string
  icono: string
  color: string
  descripcion: string
  activo: boolean
  totalPedidos: number
}

interface EtiquetaDto {
  estado: OrderStatusId
  nombre: string
  descripcion: string
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const pad = (id: number) => String(id).padStart(3, '0')
/** Número que va después del último guion (`ORD-2026-007` → 7, `CLI-003` → 3). */
const numberOf = (id: string) => Number(id.slice(id.lastIndexOf('-') + 1))

/** `ORD-{año de registro}-###`: el número es el id de la API. */
const toOrderId = (id: number, createdAt: string) => `ORD-${new Date(createdAt).getFullYear()}-${pad(id)}`

const toOrder = (dto: PedidoDto): Order => ({
  id: toOrderId(dto.id, dto.creadoEn),
  customerId: dto.cliente.id === null ? null : `CLI-${pad(dto.cliente.id)}`,
  client: dto.cliente.nombre,
  phone: dto.cliente.telefono,
  email: dto.cliente.correo,
  city: dto.ciudad,
  channel: dto.canal.nombre,
  date: nowStamp(new Date(dto.creadoEn)),
  total: Number(dto.total),
  status: dto.estado,
  paymentMethod: dto.formaPago,
  deliveryMethod: dto.formaEntrega,
  notes: dto.notas,
  items: dto.lineas.map((l) => ({
    productId: `PRD-${pad(l.productoId)}`,
    sku: l.sku,
    name: l.nombre,
    quantity: l.cantidad,
    unitPrice: Number(l.precioUnitario),
    discountPercent: Number(l.descuento),
  })),
  charges: dto.cargos.map((c) => ({ id: `CHG-${c.id}`, concept: c.concepto, amount: Number(c.monto) })),
  reservedUntil: dto.reservadoHasta,
  // El admin identifica la factura por su número de control (= `Invoice.id`).
  invoiceId: dto.factura?.numeroControl ?? null,
  // La cotización de origen se enlaza en L16 (D-18).
  quoteId: null,
  history: dto.historial.map((e) => ({ status: e.estado, at: e.fecha, by: e.por, ...(e.nota ? { note: e.nota } : {}) })),
})

/**
 * Cuerpo del pedido: solo cantidades, descuentos y cargos; nunca precios, importes ni totales.
 * El canal viaja por id (el admin lo maneja por nombre).
 */
const toPedidoBody = (draft: OrderDraft, canalId: number) => ({
  clienteId: draft.customerId ? numberOf(draft.customerId) : null,
  ...(draft.customerId ? {} : { cliente: { nombre: draft.client, telefono: draft.phone, correo: draft.email } }),
  ciudad: draft.city,
  canalId,
  formaPago: draft.paymentMethod,
  formaEntrega: draft.deliveryMethod,
  notas: draft.notes,
  lineas: draft.items.map((i) => ({
    productoId: numberOf(i.productId),
    cantidad: i.quantity,
    // La API acepta hasta 2 decimales.
    descuento: Math.round(i.discountPercent * 100) / 100,
  })),
  cargos: draft.charges.map((c) => ({ concepto: c.concept, monto: c.amount })),
})

const orderPath = (id?: string) => (id ? `/admin/pedidos/${numberOf(id)}` : '/admin/pedidos')

/* ---------- Pedidos ---------- */

/** Todos los pedidos vigentes, de 100 en 100 (precarga: el admin filtra y pagina en el cliente). */
export async function fetchOrders(): Promise<Order[]> {
  const orders: Order[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<PedidoDto>>('/admin/pedidos', { params: { limit: 100, page } })
    orders.push(...data.data.map(toOrder))
    if (page >= data.meta.totalPages) return orders
  }
}

/** Un pedido tal como está en el servidor (tras facturar o anular, L15). */
export async function fetchOrderApi(id: string): Promise<Order> {
  const { data } = await apiClient.get<Envelope<PedidoDto>>(orderPath(id))
  return toOrder(data.data)
}

export async function createOrderApi(draft: OrderDraft, canalId: number): Promise<Order> {
  const { data } = await apiClient.post<Envelope<PedidoDto>>(orderPath(), toPedidoBody(draft, canalId))
  return toOrder(data.data)
}

export async function updateOrderApi(id: string, draft: OrderDraft, canalId: number): Promise<Order> {
  const { data } = await apiClient.patch<Envelope<PedidoDto>>(orderPath(id), toPedidoBody(draft, canalId))
  return toOrder(data.data)
}

/** Cancelar o entregar (L13). */
export async function changeOrderStatusApi(id: string, status: 'cancelado' | 'entregado', note?: string): Promise<Order> {
  const { data } = await apiClient.patch<Envelope<PedidoDto>>(`${orderPath(id)}/estado`, { estado: status, ...(note ? { nota: note } : {}) })
  return toOrder(data.data)
}

/**
 * «Confirmar y reservar» (L14): el servidor aparta el stock hasta `until` (YYYY-MM-DD, inclusive) bajo
 * bloqueo de fila; 422 si no alcanza o la fecha no es válida. Repetir la misma reserva no aparta más.
 */
export async function reserveOrderApi(id: string, until: string): Promise<Order> {
  const { data } = await apiClient.post<Envelope<PedidoDto>>(`${orderPath(id)}/reserva`, { hasta: until })
  return toOrder(data.data)
}

/** Eliminación lógica: el servidor conserva el pedido con quién, cuándo y por qué. */
export async function deleteOrderApi(id: string, reason: string): Promise<void> {
  await apiClient.delete(orderPath(id), { data: { motivo: reason } })
}

/* ---------- Canales ---------- */

const toChannel = (dto: CanalDto): Channel => ({
  id: String(dto.id),
  name: dto.nombre,
  badge: dto.insignia,
  icon: dto.icono,
  color: dto.color,
  description: dto.descripcion,
  active: dto.activo,
})

const toCanalBody = (draft: Omit<ChannelDraft, 'id'>) => ({
  nombre: draft.name,
  insignia: draft.badge,
  icono: draft.icon,
  descripcion: draft.description,
  activo: draft.active,
})

export async function fetchChannels(): Promise<Channel[]> {
  const { data } = await apiClient.get<Envelope<CanalDto[]>>('/admin/canales-venta')
  return data.data.map(toChannel)
}

/** Alta (sin id) o edición; devuelve el canal tal como quedó en el servidor. */
export async function saveChannelApi({ id, ...draft }: ChannelDraft): Promise<Channel> {
  const { data } = id
    ? await apiClient.patch<Envelope<CanalDto>>(`/admin/canales-venta/${id}`, toCanalBody(draft))
    : await apiClient.post<Envelope<CanalDto>>('/admin/canales-venta', toCanalBody(draft))
  return toChannel(data.data)
}

export async function setChannelActiveApi(id: string, active: boolean): Promise<Channel> {
  const { data } = await apiClient.patch<Envelope<CanalDto>>(`/admin/canales-venta/${id}`, { activo: active })
  return toChannel(data.data)
}

export async function deleteChannelApi(id: string): Promise<void> {
  await apiClient.delete(`/admin/canales-venta/${id}`)
}

/* ---------- Etiquetas de estado ---------- */

export async function fetchStatusLabels(): Promise<StatusLabels> {
  const { data } = await apiClient.get<Envelope<EtiquetaDto[]>>('/admin/estados-pedido')
  return Object.fromEntries(data.data.map((e) => [e.estado, { name: e.nombre, description: e.descripcion }]))
}

export async function saveStatusLabelApi(status: OrderStatusId, label: { name: string; description: string }): Promise<void> {
  await apiClient.put(`/admin/estados-pedido/${status}`, { nombre: label.name, descripcion: label.description })
}
