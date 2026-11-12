import type { Order, OrderCharge, OrderItem, OrderPrefill } from './05-types'
import { DELIVERY_METHODS, PAYMENT_METHODS } from './02-order.service'

/** Datos iniciales del constructor de pedidos (nuevo, desde cotización o edición). */
export interface OrderSeed {
  customer: OrderPrefill['customer'] | undefined
  items: OrderItem[]
  charges: OrderCharge[]
  fields: { channel: string; paymentMethod: string; deliveryMethod: string; city: string; notes: string }
}

/**
 * Semilla del constructor: un pedido a editar tiene prioridad; si no, la pre-carga
 * de una cotización; si no, un pedido vacío con los valores por defecto.
 */
export function orderSeed(editing: Order | undefined, prefill: OrderPrefill | null, defaultChannel: string): OrderSeed {
  if (editing) {
    return {
      customer: { customerId: editing.customerId, name: editing.client, phone: editing.phone, email: editing.email },
      items: editing.items,
      charges: editing.charges ?? [],
      fields: {
        channel: editing.channel, paymentMethod: editing.paymentMethod, deliveryMethod: editing.deliveryMethod,
        city: editing.city, notes: editing.notes,
      },
    }
  }
  return {
    customer: prefill?.customer,
    items: prefill?.items ?? [],
    charges: prefill?.charges ?? [],
    fields: { channel: defaultChannel, paymentMethod: PAYMENT_METHODS[0], deliveryMethod: DELIVERY_METHODS[0], city: '', notes: prefill?.notes ?? '' },
  }
}

/**
 * Opciones de un select con valores vigentes; si el pedido editado guardó uno que ya
 * no se ofrece (ej. una forma de pago retirada), se conserva marcado como "anterior"
 * para no cambiarlo sin que el usuario lo note.
 */
export function optionsWithLegacy(values: string[], current: string, label = (v: string) => v) {
  const options = values.map((v) => ({ value: v, label: label(v) }))
  return current && !values.includes(current) ? [...options, { value: current, label: `${current} (anterior)` }] : options
}
