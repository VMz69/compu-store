import type { BadgeTone } from '@/shared/ui'
import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceTotals, PaymentCondition } from '../types'

/**
 * Lógica pura de facturación (sin React ni store): totales, correlativos e
 * identificadores del DTE. Compartida por la pantalla y el PDF.
 */

/** Prefijo del número de control: DTE-01 (Factura) · establecimiento M001 · punto de venta P001. */
export const CONTROL_PREFIX = 'DTE-01-M001P001-'
/** Últimos correlativos usados antes de este sistema (según el documento de muestra). */
const LAST_CONTROL = 2074
const LAST_INTERNAL = 15781

const money = (value: number): number => Math.round(value * 100) / 100

export const lineAmount = (item: InvoiceItem): number => money(item.unitPrice * item.quantity - item.discount)

/**
 * Factura de Consumidor Final: los precios incluyen IVA y no hay retenciones,
 * por eso "Sub-total", "Monto total de la operación" y "Total a pagar" coinciden.
 */
export function invoiceTotals(items: InvoiceItem[]): InvoiceTotals {
  return {
    taxed: money(items.reduce((acc, i) => acc + lineAmount(i), 0)),
    discount: money(items.reduce((acc, i) => acc + i.discount, 0)),
    total: money(items.reduce((acc, i) => acc + lineAmount(i), 0)),
    units: items.reduce((acc, i) => acc + i.quantity, 0),
  }
}

const maxSuffix = (values: string[], prefix: string, fallback: number): number =>
  values.reduce((max, v) => Math.max(max, parseInt(v.replace(prefix, ''), 10) || 0), fallback)

/** Siguiente número de control (15 dígitos). */
export const nextControlNumber = (invoices: Invoice[]): string =>
  `${CONTROL_PREFIX}${String(maxSuffix(invoices.map((i) => i.id), CONTROL_PREFIX, LAST_CONTROL) + 1).padStart(15, '0')}`

/** Siguiente correlativo interno (6 dígitos). */
export const nextInternalId = (invoices: Invoice[]): string =>
  String(maxSuffix(invoices.map((i) => i.internalId), '', LAST_INTERNAL) + 1).padStart(6, '0')

/** Código de generación con formato UUID v4 en mayúsculas. */
export const newGenerationCode = (): string => crypto.randomUUID().toUpperCase()

/** Sello de recepción SIMULADO (40 caracteres, como el que devuelve Hacienda). */
export function simulatedSeal(date = new Date()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `${date.getFullYear()}${hex}`
}

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

export function filterInvoices(invoices: Invoice[], search: string, status: 'all' | InvoiceStatus): Invoice[] {
  const term = search.trim().toLowerCase()
  return invoices.filter((inv) => {
    if (status !== 'all' && inv.status !== status) return false
    if (!term) return true
    return [inv.id, inv.internalId, inv.orderId, inv.receptor.name].some((f) => f.toLowerCase().includes(term))
  })
}
