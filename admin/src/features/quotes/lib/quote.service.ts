import type { BadgeTone } from '@/shared/ui'
import { sumCharges, type ExtraCharge } from '@/shared/lib/charges'
import { lineTotal as pricedLineTotal, money, summarizeLines } from '@/shared/lib/pricing'
import { nextSequentialId } from '@/shared/lib/text'
import type { Quote, QuoteItem, QuoteStatus, QuoteTotals } from '../types'

/**
 * Lógica pura de cotizaciones (sin React ni store). Compartida por la lista,
 * el constructor y el generador de PDF para que los montos siempre coincidan.
 */

export const QUOTE_ID_PREFIX = 'COT-2026-'
export const VALIDITY_OPTIONS = [7, 15, 30]
export const DEFAULT_VALIDITY_DAYS = 15

/** Total de una línea con su descuento aplicado (IVA incluido). Misma aritmética que pedidos. */
export const lineTotal = (item: QuoteItem): number => pricedLineTotal(item)

/**
 * Totales del documento: productos + cargos extra. Los precios ya incluyen IVA,
 * así que el IVA se "extrae" del total: neto = total / (1 + tasa).
 */
export function calcTotals(items: QuoteItem[], charges: Pick<ExtraCharge, 'amount'>[], taxRate: number): QuoteTotals {
  const { gross, discount, total: productsTotal, units } = summarizeLines(items)
  const chargesTotal = sumCharges(charges)
  const total = money(productsTotal + chargesTotal)
  const net = money(total / (1 + taxRate))
  return { gross, discount, productsTotal, chargesTotal, total, net, tax: money(total - net), units }
}

/** Fecha límite de validez (ISO). */
export const validUntil = (quote: Pick<Quote, 'createdAt' | 'validityDays'>): string => {
  const date = new Date(quote.createdAt)
  date.setDate(date.getDate() + quote.validityDays)
  return date.toISOString()
}

/**
 * Estado mostrado. Prioridad: convertida (tiene pedido activo) → vencida
 * (emitida fuera de validez) → estado guardado.
 */
export function effectiveStatus(quote: Quote, orderId: string | null = null, now: Date = new Date()): QuoteStatus {
  if (orderId) return 'convertida'
  if (quote.status === 'emitida' && new Date(validUntil(quote)) < now) return 'vencida'
  return quote.status
}

/** Regla de conversión: solo cotizaciones vigentes (emitidas o aceptadas) sin pedido activo. */
export const isConvertible = (status: QuoteStatus): boolean => status === 'emitida' || status === 'aceptada'

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: BadgeTone; icon: string }> = {
  emitida: { label: 'Emitida', tone: 'brand', icon: 'fa-solid fa-paper-plane' },
  aceptada: { label: 'Aceptada', tone: 'success', icon: 'fa-solid fa-circle-check' },
  rechazada: { label: 'Rechazada', tone: 'danger', icon: 'fa-solid fa-circle-xmark' },
  vencida: { label: 'Vencida', tone: 'neutral', icon: 'fa-solid fa-hourglass-end' },
  convertida: { label: 'Convertida en pedido', tone: 'success', icon: 'fa-solid fa-cart-shopping' },
}

export const nextQuoteId = (quotes: Quote[]): string =>
  nextSequentialId(
    quotes.map((q) => q.id),
    QUOTE_ID_PREFIX,
  )

export function filterQuotes(
  quotes: Quote[],
  search: string,
  status: 'all' | QuoteStatus,
  orderOf: (quoteId: string) => string | null = () => null,
): Quote[] {
  const term = search.trim().toLowerCase()
  return quotes.filter((q) => {
    if (status !== 'all' && effectiveStatus(q, orderOf(q.id)) !== status) return false
    if (!term) return true
    return [q.id, q.customer.name, q.customer.phone, q.createdBy].some((f) => f.toLowerCase().includes(term))
  })
}
