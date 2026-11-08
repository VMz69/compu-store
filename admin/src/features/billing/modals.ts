/** Claves de modales del feature (resueltas por el ModalHost de la app). */
export const BILLING_MODALS = {
  /** Emisión de factura desde un pedido. Payload: id del pedido. */
  emit: 'invoice-emit',
  /** Vista previa del PDF. Payload: número de control (id) de la factura. */
  preview: 'invoice-preview',
} as const
