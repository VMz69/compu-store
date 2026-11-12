export type InvoiceStatus = 'emitida' | 'anulada'

export type PaymentCondition = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Crédito'

/** "product" = sale del inventario · "charge" = cargo extra del pedido (servicio, sin stock). */
export type InvoiceItemKind = 'product' | 'charge'

/** Línea de factura (copiada del pedido al emitir; no cambia si cambia el catálogo). */
export interface InvoiceItem {
  /** Ausente en facturas anteriores a los cargos extra: se asume "product". */
  kind?: InvoiceItemKind
  /** Id del producto; en cargos extra, id del cargo (no existe en el catálogo). */
  productId: string
  description: string
  /** Unidad de medida (ej. "Unidad"). */
  unit: string
  quantity: number
  /** Precio unitario con IVA incluido (Factura de Consumidor Final). */
  unitPrice: number
  /** Descuento en dólares aplicado a la línea. */
  discount: number
}

/** Receptor del documento. "Consumidor Final" cuando no se identifica al cliente. */
export interface InvoiceReceptor {
  isFinalConsumer: boolean
  name: string
  /** DUI o NIT; vacío para consumidor final. */
  documentId: string
  address: string
  email: string
  phone: string
}

/** Datos del contribuyente emisor al momento de emitir (snapshot). */
export interface InvoiceIssuer {
  tradeName: string
  legalName: string
  nit: string
  nrc: string
  address: string
  phone: string
  email: string
  establishmentType: string
  economicActivity: string
}

export interface Invoice {
  /** Número de control DTE (ej. "DTE-01-M001P001-000000000002077"). Es el id. */
  id: string
  /** Código de generación (UUID en mayúsculas). */
  generationCode: string
  /**
   * Sello de recepción. ⚠️ Simulado: el real lo asigna el Ministerio de Hacienda
   * al transmitir el DTE (integración pendiente).
   */
  receptionSeal: string
  /** Correlativo interno de 6 dígitos (ej. "015782"). */
  internalId: string
  orderId: string
  receptor: InvoiceReceptor
  paymentCondition: PaymentCondition
  items: InvoiceItem[]
  notes: string
  status: InvoiceStatus
  /** Fecha ISO de emisión. */
  createdAt: string
  createdBy: string
  issuer: InvoiceIssuer
  /** Fecha ISO de anulación, si aplica. */
  voidedAt: string | null
}

export interface InvoiceTotals {
  /** Ventas gravadas (con IVA incluido) después de descuentos. */
  taxed: number
  discount: number
  /** Suma de cargos extra (servicios), ya incluida en `taxed` y `total`. */
  charges: number
  /** Monto total de la operación = total a pagar (sin retenciones en consumidor final). */
  total: number
  /** Unidades de producto (los cargos extra no cuentan). */
  units: number
}
