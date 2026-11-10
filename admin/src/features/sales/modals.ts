/** Claves de modales del feature (resueltas por el ModalHost de la app). */
export const SALES_MODALS = {
  orderDetail: 'order-detail',
  channelForm: 'channel-form',
  /** Editar nombre/descripción de un estado del flujo. Payload: id del estado. */
  statusLabel: 'status-label',
  /** "Confirmar y reservar" con calendario de vigencia. Payload: id del pedido. */
  reserveOrder: 'reserve-order',
} as const
