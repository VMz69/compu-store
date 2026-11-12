import type { OrderItem } from '../42-pipeline-persistencia-pedidos/05-types'

export interface OrderFieldsInput {
  channel: string
  paymentMethod: string
  deliveryMethod: string
}

/**
 * Validación del constructor de pedidos (además de la del cliente).
 * Las líneas con stock insuficiente se marcan con `items.<productId>`.
 */
export function validateOrder(
  fields: OrderFieldsInput,
  items: OrderItem[],
  availableOf: (productId: string) => number,
): Record<string, string> {
  const e: Record<string, string> = {}
  if (items.length === 0) e.items = 'Agrega al menos un producto con stock disponible.'
  for (const item of items) {
    const available = availableOf(item.productId)
    if (item.quantity > available) {
      e[`items.${item.productId}`] =
        available === 0 ? 'Sin stock disponible: quita el producto.' : `Solo hay ${available} disponible(s); ajusta la cantidad.`
    }
  }
  if (!fields.channel) e.channel = 'Selecciona el canal de venta.'
  if (!fields.paymentMethod) e.paymentMethod = 'Selecciona la forma de pago.'
  if (!fields.deliveryMethod.trim()) e.deliveryMethod = 'Indica la forma de entrega.'
  return e
}
