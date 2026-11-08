import type { BadgeTone } from '@/shared/ui'
import { nextSequentialId } from '@/shared/lib/text'
import type { Quote, QuoteItem, QuoteStatus, QuoteTotals } from '../types'

/**
 * Lógica pura de cotizaciones (sin React ni store). Compartida por la lista,
 * el constructor y el generador de PDF para que los montos siempre coincidan.
 */

export const QUOTE_ID_PREFIX = 'COT-2026-'
export const VALIDITY_OPTIONS = [7, 15, 30]
export const DEFAULT_VALIDITY_DAYS = 15

/** Redondeo monetario a 2 decimales (evita 0.1 + 0.2 = 0.30000000000000004). */
const money = (value: number): number => Math.round(value * 100) / 100

/** Total de una línea con su descuento aplicado (IVA incluido). */
export const lineTotal = (item: QuoteItem): number =>
  money(item.unitPrice * item.quantity * (1 - item.discountPercent / 100))

/**
 * Totales del documento. Los precios del catálogo ya incluyen IVA, así que el
 * IVA se "extrae" del total: neto = total / (1 + tasa).
 */
export function calcTotals(items: QuoteItem[], taxRate: number): QuoteTotals {
  const gross = money(items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0))
  const total = money(items.reduce((acc, i) => acc + lineTotal(i), 0))
  const net = money(total / (1 + taxRate))
  return {
    gross,
    discount: money(gross - total),
    total,
    net,
    tax: money(total - net),
    units: items.reduce((acc, i) => acc + i.quantity, 0),
  }
}

/** Fecha límite de validez (ISO). */
export const validUntil = (quote: Pick<Quote, 'createdAt' | 'validityDays'>): string => {
  const date = new Date(quote.createdAt)
  date.setDate(date.getDate() + quote.validityDays)
  return date.toISOString()
}

/** Una cotización emitida cuya validez ya pasó se muestra como "vencida". */
export function effectiveStatus(quote: Quote, now: Date = new Date()): QuoteStatus {
  if (quote.status === 'emitida' && new Date(validUntil(quote)) < now) return 'vencida'
  return quote.status
}

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: BadgeTone; icon: string }> = {
  emitida: { label: 'Emitida', tone: 'brand', icon: 'fa-solid fa-paper-plane' },
  aceptada: { label: 'Aceptada', tone: 'success', icon: 'fa-solid fa-circle-check' },
  rechazada: { label: 'Rechazada', tone: 'danger', icon: 'fa-solid fa-circle-xmark' },
  vencida: { label: 'Vencida', tone: 'neutral', icon: 'fa-solid fa-hourglass-end' },
}

export const nextQuoteId = (quotes: Quote[]): string =>
  nextSequentialId(
    quotes.map((q) => q.id),
    QUOTE_ID_PREFIX,
  )

export function filterQuotes(quotes: Quote[], search: string, status: 'all' | QuoteStatus): Quote[] {
  const term = search.trim().toLowerCase()
  return quotes.filter((q) => {
    if (status !== 'all' && effectiveStatus(q) !== status) return false
    if (!term) return true
    return [q.id, q.customer.name, q.customer.phone, q.createdBy].some((f) => f.toLowerCase().includes(term))
  })
}
