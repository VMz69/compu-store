import type { ExtraCharge } from '@/shared/lib/charges'

/** Estado guardado. "vencida" no se guarda: se deriva de la fecha de validez. */
export type QuoteStoredStatus = 'emitida' | 'aceptada' | 'rechazada'

/**
 * Estado que se muestra. Derivados (no se guardan):
 * - "convertida": tiene un pedido activo (Pedidos guarda el vínculo `order.quoteId`).
 * - "vencida": emitida y fuera de su validez.
 */
export type QuoteStatus = QuoteStoredStatus | 'vencida' | 'convertida'

/** Línea de la cotización. Copia nombre/SKU/precio al cotizar: si el catálogo cambia, el documento no. */
export interface QuoteItem {
  productId: string
  sku: string
  name: string
  /** Precio unitario con IVA incluido al momento de cotizar. */
  unitPrice: number
  quantity: number
  /** Descuento por línea, 0–100. */
  discountPercent: number
}

/** Datos del cliente tal como se cotizó (snapshot del directorio o captura manual). */
export interface QuoteCustomer {
  /** Id del directorio de clientes; `null` para un cliente ocasional. */
  customerId: string | null
  name: string
  phone: string
  email: string
  documentId: string
}

/** Identidad del emisor al momento de emitir (un documento formal no cambia si luego se edita la empresa). */
export interface QuoteIssuer {
  name: string
  address: string
  phones: string[]
  email: string
  taxRate: number
}

export interface Quote {
  /** Correlativo, ej. "COT-2026-007". */
  id: string
  customer: QuoteCustomer
  items: QuoteItem[]
  /** Cargos extra cotizados (envío, instalación…): suman al total y pasan al pedido al convertir. */
  charges: ExtraCharge[]
  notes: string
  /** Días de validez desde la emisión. */
  validityDays: number
  status: QuoteStoredStatus
  /** Fecha ISO de emisión. */
  createdAt: string
  /** Nombre del colaborador que emitió. */
  createdBy: string
  issuer: QuoteIssuer
}

export interface QuoteTotals {
  /** Suma bruta (precio × cantidad) con IVA. */
  gross: number
  /** Total de descuentos aplicados. */
  discount: number
  /** Productos con descuentos (sin cargos). */
  productsTotal: number
  /** Suma de cargos extra. */
  chargesTotal: number
  /** Total a pagar: productos + cargos extra (IVA incluido). */
  total: number
  /** Base imponible (total sin IVA). */
  net: number
  /** IVA contenido en el total. */
  tax: number
  units: number
}
