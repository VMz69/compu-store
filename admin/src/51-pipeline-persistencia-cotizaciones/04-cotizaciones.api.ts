import { provideQuoteApiId } from '@/00-director-ventas'
import { STORE_CONFIG } from '@/85-pipeline-identificadores-texto/03-store.config'
import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { Quote, QuoteStoredStatus } from './03-types'

/**
 * Adaptador de cotizaciones (L16): `/admin/cotizaciones` ↔ `Quote` del admin (D-14, D-19). El servidor fija
 * precios (vigentes al emitir), importes, total, emisor, número, código y autor; el navegador solo envía el
 * cliente, cantidades, descuentos, cargos, notas y validez. El id del admin es el código (`COT-AAAA-###`);
 * el id numérico de la API se recuerda aquí para cambiar el estado, eliminar y convertir.
 */

interface CotizacionDto {
  id: number
  numero: number
  codigo: string
  cliente: { id: number | null; nombre: string; telefono: string; correo: string; documento: string }
  lineas: { productoId: number | null; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { id: number; concepto: string; monto: string }[]
  notas: string
  validezDias: number
  validaHasta: string
  estado: QuoteStoredStatus
  emisor: { nombreComercial: string; direccion: string; telefono: string; correo: string }
  total: string
  creadaEn: string
  creadaPor: string
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const pad = (n: number) => String(n).padStart(3, '0')
/** Número que va después del último guion (`CLI-003` → 3, `PRD-012` → 12). */
const numberOf = (id: string) => Number(id.slice(id.lastIndexOf('-') + 1))

/** Código → id de la API. */
const apiIds = new Map<string, number>()

// Pedidos convierte por id sin importar Cotizaciones (puerto, L16).
provideQuoteApiId((quoteId) => apiIds.get(quoteId))

const toQuote = (dto: CotizacionDto): Quote => {
  apiIds.set(dto.codigo, dto.id)
  return {
    id: dto.codigo,
    customer: {
      customerId: dto.cliente.id === null ? null : `CLI-${pad(dto.cliente.id)}`,
      name: dto.cliente.nombre,
      phone: dto.cliente.telefono,
      email: dto.cliente.correo,
      documentId: dto.cliente.documento,
    },
    items: dto.lineas.map((l) => ({
      // Si el producto se eliminó, la línea conserva su snapshot pero ya no apunta al catálogo.
      productId: l.productoId === null ? '' : `PRD-${pad(l.productoId)}`,
      sku: l.sku,
      name: l.nombre,
      unitPrice: Number(l.precioUnitario),
      quantity: l.cantidad,
      discountPercent: Number(l.descuento),
    })),
    charges: dto.cargos.map((c) => ({ id: `CHG-${c.id}`, concept: c.concepto, amount: Number(c.monto) })),
    notes: dto.notas,
    validityDays: dto.validezDias,
    status: dto.estado,
    createdAt: dto.creadaEn,
    createdBy: dto.creadaPor,
    issuer: {
      name: dto.emisor.nombreComercial,
      address: dto.emisor.direccion,
      // La API une los teléfonos con « / », como los imprime el admin.
      phones: dto.emisor.telefono.split(' / ').filter(Boolean),
      email: dto.emisor.correo,
      // El IVA global no vive en el servidor: la misma constante que Ajustes › Identidad.
      taxRate: STORE_CONFIG.taxRate,
    },
  }
}

const quotePath = (quoteId: string) => {
  const id = apiIds.get(quoteId)
  if (id === undefined) throw new Error(`La cotización ${quoteId} no está cargada: recarga Cotizaciones.`)
  return `/admin/cotizaciones/${id}`
}

/** Todas las cotizaciones, de 100 en 100 (precarga: el admin filtra y pagina en el cliente). */
export async function fetchQuotes(): Promise<Quote[]> {
  const quotes: Quote[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<CotizacionDto>>('/admin/cotizaciones', { params: { limit: 100, page } })
    quotes.push(...data.data.map(toQuote))
    if (page >= data.meta.totalPages) return quotes
  }
}

/** Lo que el navegador decide al emitir; el resto de `Quote` lo asigna el servidor. */
export type EmitQuoteInput = Pick<Quote, 'customer' | 'items' | 'charges' | 'notes' | 'validityDays'>

/** Emite: solo cantidades, descuentos y cargos; nunca precios, importes, emisor, número ni autor. */
export async function createQuoteApi({ customer, items, charges, notes, validityDays }: EmitQuoteInput): Promise<Quote> {
  const { data } = await apiClient.post<Envelope<CotizacionDto>>('/admin/cotizaciones', {
    clienteId: customer.customerId ? numberOf(customer.customerId) : null,
    ...(customer.customerId
      ? {}
      : { cliente: { nombre: customer.name, telefono: customer.phone, correo: customer.email, documento: customer.documentId } }),
    lineas: items.map((i) => ({
      productoId: numberOf(i.productId),
      cantidad: i.quantity,
      // La API acepta hasta 2 decimales.
      descuento: Math.round(i.discountPercent * 100) / 100,
    })),
    cargos: charges.map((c) => ({ concepto: c.concept, monto: c.amount })),
    notas: notes,
    validezDias: validityDays,
  })
  return toQuote(data.data)
}

/** Aceptar o rechazar; 422 si ya no está emitida y vigente. */
export async function setQuoteStatusApi(quoteId: string, status: Exclude<QuoteStoredStatus, 'emitida'>): Promise<Quote> {
  const { data } = await apiClient.patch<Envelope<CotizacionDto>>(`${quotePath(quoteId)}/estado`, { estado: status })
  return toQuote(data.data)
}

/** Borrado real; 409 si originó algún pedido (también cancelado o eliminado). */
export async function deleteQuoteApi(quoteId: string): Promise<void> {
  await apiClient.delete(quotePath(quoteId))
  apiIds.delete(quoteId)
}
