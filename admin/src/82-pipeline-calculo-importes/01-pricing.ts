/**
 * Aritmética de líneas de venta compartida por cotizaciones, pedidos y facturas.
 * Precios con IVA incluido; descuento porcentual por línea.
 */

/** Redondeo monetario a 2 decimales (evita 0.1 + 0.2 = 0.30000000000000004). */
export const money = (value: number): number => Math.round(value * 100) / 100

export interface PricedLine {
  unitPrice: number
  quantity: number
  /** 0–100. */
  discountPercent: number
}

export const lineGross = (line: PricedLine): number => money(line.unitPrice * line.quantity)

/** Total de la línea con su descuento aplicado. */
export const lineTotal = (line: PricedLine): number =>
  money(line.unitPrice * line.quantity * (1 - line.discountPercent / 100))

/** Descuento de la línea en dólares. */
export const lineDiscount = (line: PricedLine): number => money(lineGross(line) - lineTotal(line))

export interface LinesSummary {
  gross: number
  discount: number
  total: number
  units: number
}

export function summarizeLines(lines: PricedLine[]): LinesSummary {
  const gross = money(lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0))
  const total = money(lines.reduce((acc, l) => acc + lineTotal(l), 0))
  return { gross, discount: money(gross - total), total, units: lines.reduce((acc, l) => acc + l.quantity, 0) }
}

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
