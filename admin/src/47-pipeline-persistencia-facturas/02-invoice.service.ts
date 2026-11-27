import { matchesQuery } from '@/85-pipeline-identificadores-texto/00-director-identificadores-texto'
import type { BadgeTone } from '@/00-director-interfaz'
import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceTotals, PaymentCondition } from './03-types'

/**
 * Lógica pura de facturación (sin React ni store): totales y último correlativo.
 * Compartida por la pantalla y el PDF. Desde L15 los números, el código de generación y el
 * sello (simulado) los asigna el servidor al emitir (D-12).
 */

/** Último correlativo interno antes de este sistema (= fila inicial de `correlativos` en la API). */
const LAST_INTERNAL = 15781

const money = (value: number): number => Math.round(value * 100) / 100

export const lineAmount = (item: InvoiceItem): number => money(item.unitPrice * item.quantity - item.discount)

/** Línea que sale del inventario (las facturas antiguas no tienen `kind`: son productos). */
export const isProductItem = (item: InvoiceItem): boolean => item.kind !== 'charge'

/** Movimiento de inventario de la factura: solo productos, nunca cargos extra. */
export const stockLines = (items: InvoiceItem[]) =>
  items.filter(isProductItem).map((i) => ({ productId: i.productId, quantity: i.quantity }))

/**
 * Factura de Consumidor Final: los precios incluyen IVA y no hay retenciones,
 * por eso "Sub-total", "Monto total de la operación" y "Total a pagar" coinciden.
 */
export function invoiceTotals(items: InvoiceItem[]): InvoiceTotals {
  return {
    taxed: money(items.reduce((acc, i) => acc + lineAmount(i), 0)),
    discount: money(items.reduce((acc, i) => acc + i.discount, 0)),
    charges: money(items.filter((i) => !isProductItem(i)).reduce((acc, i) => acc + lineAmount(i), 0)),
    total: money(items.reduce((acc, i) => acc + lineAmount(i), 0)),
    units: items.filter(isProductItem).reduce((acc, i) => acc + i.quantity, 0),
  }
}

const maxSuffix = (values: string[], prefix: string, fallback: number): number =>
  values.reduce((max, v) => Math.max(max, parseInt(v.replace(prefix, ''), 10) || 0), fallback)

/** Último correlativo interno usado (incluye anuladas: un número nunca se reutiliza). */
export const lastInternalNumber = (invoices: Invoice[]): number => maxSuffix(invoices.map((i) => i.internalId), '', LAST_INTERNAL)

export const PAYMENT_CONDITIONS: PaymentCondition[] = ['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito']

/** Condición de pago sugerida a partir del método registrado en el pedido. */
export function paymentConditionFrom(method: string): PaymentCondition {
  const m = method.toLowerCase()
  if (m.includes('crédito fiscal') || m.includes('30 días')) return 'Crédito'
  if (m.includes('tarjeta') || m.includes('wompi')) return 'Tarjeta'
  if (m.includes('transferencia')) return 'Transferencia'
  return 'Efectivo'
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; tone: BadgeTone; icon: string }> = {
  emitida: { label: 'Emitida', tone: 'success', icon: 'fa-solid fa-circle-check' },
  anulada: { label: 'Anulada', tone: 'danger', icon: 'fa-solid fa-ban' },
}

/** Campos del buscador de facturas emitidas (varios parámetros a la vez). */
export const invoiceSearchFields = (inv: Invoice): Array<string | null> => [
  inv.id, inv.internalId, inv.orderId, inv.receptor.name, inv.receptor.documentId, inv.receptor.email,
  inv.receptor.phone, inv.paymentCondition, inv.createdBy, INVOICE_STATUS_META[inv.status].label, inv.createdAt.slice(0, 10),
  ...inv.items.map((i) => i.description),
]

export function filterInvoices(invoices: Invoice[], search: string, status: 'all' | InvoiceStatus): Invoice[] {
  return invoices.filter((inv) => (status === 'all' || inv.status === status) && matchesQuery(invoiceSearchFields(inv), search))
}
