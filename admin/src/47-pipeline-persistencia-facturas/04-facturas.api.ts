import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { Invoice, InvoiceReceptor, PaymentCondition } from './03-types'

/**
 * Adaptador de facturas (L15): `/admin/facturas` ↔ `Invoice` del admin (D-14, D-19). El servidor emite en
 * una transacción (líneas copiadas del pedido, importes, emisor, números, descuento de stock y cambio de
 * estado del pedido); el navegador solo elige el pedido, el receptor, la condición de pago y las notas.
 * El id del admin es el número de control; el id numérico de la API se recuerda aquí para anular.
 */

type CondicionPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito'

interface FacturaDto {
  id: number
  numeroControl: string
  correlativo: number
  codigoGeneracion: string
  selloRecepcion: string
  pedido: { id: number; visible: string }
  receptor: { consumidorFinal: boolean; nombre: string; documento: string; direccion: string; correo: string; telefono: string }
  condicionPago: CondicionPago
  notas: string
  emisor: {
    nombreComercial: string
    razonSocial: string
    nit: string
    nrc: string
    direccion: string
    telefono: string
    correo: string
    tipoEstablecimiento: string
    actividadEconomica: string
  }
  lineas: {
    id: number
    tipo: 'producto' | 'cargo'
    productoId: number | null
    descripcion: string
    unidad: string
    cantidad: number
    precioUnitario: string
    descuento: string
    importe: string
  }[]
  total: string
  estado: Invoice['status']
  creadaEn: string
  creadaPor: string
  anuladaEn: string | null
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const CONDICION_A_PAGO: Record<CondicionPago, PaymentCondition> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
}
const PAGO_A_CONDICION = Object.fromEntries(Object.entries(CONDICION_A_PAGO).map(([k, v]) => [v, k])) as Record<PaymentCondition, CondicionPago>

const pad = (n: number, size: number) => String(n).padStart(size, '0')

/** Número de control → id de la API (lo necesita la anulación). */
const apiIds = new Map<string, number>()

const toInvoice = (dto: FacturaDto): Invoice => {
  apiIds.set(dto.numeroControl, dto.id)
  return {
    id: dto.numeroControl,
    generationCode: dto.codigoGeneracion,
    receptionSeal: dto.selloRecepcion,
    internalId: pad(dto.correlativo, 6),
    orderId: dto.pedido.visible,
    receptor: {
      isFinalConsumer: dto.receptor.consumidorFinal,
      name: dto.receptor.nombre,
      documentId: dto.receptor.documento,
      address: dto.receptor.direccion,
      email: dto.receptor.correo,
      phone: dto.receptor.telefono,
    },
    paymentCondition: CONDICION_A_PAGO[dto.condicionPago],
    items: dto.lineas.map((l) => ({
      kind: l.tipo === 'producto' ? 'product' : 'charge',
      // Cargos: no existen en el catálogo; el id de la línea los distingue.
      productId: l.tipo === 'producto' && l.productoId !== null ? `PRD-${pad(l.productoId, 3)}` : `CHG-${l.id}`,
      description: l.descripcion,
      unit: l.unidad,
      quantity: l.cantidad,
      unitPrice: Number(l.precioUnitario),
      discount: Number(l.descuento),
    })),
    notes: dto.notas,
    status: dto.estado,
    createdAt: dto.creadaEn,
    createdBy: dto.creadaPor,
    issuer: {
      tradeName: dto.emisor.nombreComercial,
      legalName: dto.emisor.razonSocial,
      nit: dto.emisor.nit,
      nrc: dto.emisor.nrc,
      address: dto.emisor.direccion,
      phone: dto.emisor.telefono,
      email: dto.emisor.correo,
      establishmentType: dto.emisor.tipoEstablecimiento,
      economicActivity: dto.emisor.actividadEconomica,
    },
    voidedAt: dto.anuladaEn,
  }
}

/** Todas las facturas, de 100 en 100 (precarga: el admin filtra y pagina en el cliente). */
export async function fetchInvoices(): Promise<Invoice[]> {
  const invoices: Invoice[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<FacturaDto>>('/admin/facturas', { params: { limit: 100, page } })
    invoices.push(...data.data.map(toInvoice))
    if (page >= data.meta.totalPages) return invoices
  }
}

export interface EmitInvoiceInput {
  /** `ORD-AAAA-###`: el número es el id de la API. */
  orderId: string
  receptor: InvoiceReceptor
  paymentCondition: PaymentCondition
  notes: string
}

/** Emite la factura de un pedido Reservado; 422 si ya no procede (estado, reserva vencida, ya facturado). */
export async function emitInvoiceApi({ orderId, receptor, paymentCondition, notes }: EmitInvoiceInput): Promise<Invoice> {
  const { data } = await apiClient.post<Envelope<FacturaDto>>('/admin/facturas', {
    pedidoId: Number(orderId.slice(orderId.lastIndexOf('-') + 1)),
    receptor: receptor.isFinalConsumer
      ? { consumidorFinal: true, correo: receptor.email }
      : { consumidorFinal: false, nombre: receptor.name, documento: receptor.documentId, direccion: receptor.address, correo: receptor.email },
    condicionPago: PAGO_A_CONDICION[paymentCondition],
    notas: notes,
  })
  return toInvoice(data.data)
}

/** Anula: el servidor repone el stock y devuelve el pedido a Reservado; 422 si ya se entregó o ya estaba anulada. */
export async function voidInvoiceApi(invoiceId: string): Promise<Invoice> {
  const id = apiIds.get(invoiceId)
  if (id === undefined) throw new Error('La factura no está cargada: recarga Facturación.')
  const { data } = await apiClient.post<Envelope<FacturaDto>>(`/admin/facturas/${id}/anulacion`)
  return toInvoice(data.data)
}
