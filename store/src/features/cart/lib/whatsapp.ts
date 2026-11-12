import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { buildWhatsAppUrl } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import type { CartItem, DeliveryMethod } from '../types'
import { calculateItemCount, calculateSubtotal, getLineTotal } from './cart.service'

/** Mensaje y enlace de WhatsApp para confirmar el pedido del carrito. */

export const buildCartOrderMessage = (
  items: CartItem[],
  deliveryMethod: DeliveryMethod = 'pickup',
  customerNote = '',
): string => {
  const subtotal = calculateSubtotal(items)
  const itemCount = calculateItemCount(items)

  let message = `👋 *¡Hola ${STORE_CONFIG.name}!* Deseo realizar el siguiente pedido:\n\n`
  message += `🛒 *DETALLE DEL PEDIDO (${itemCount} productos):*\n`
  message += `-----------------------------------------\n`

  items.forEach((item) => {
    message += `• *${item.quantity}x* ${item.product.name}\n`
    message += `   Unitario: ${formatCurrency(item.product.price)} | Subtotal: ${formatCurrency(getLineTotal(item))}\n`
  })

  message += `-----------------------------------------\n`
  message += `💰 *TOTAL A PAGAR: ${formatCurrency(subtotal)}*\n\n`
  message += `📍 *Método de Entrega:*\n`
  message +=
    deliveryMethod === 'pickup'
      ? `✅ *Retiro en Tienda Física (Cojutepeque)* - GRATIS\n`
      : `🚚 *Envío a Domicilio* (Departamental / Nacional)\n`

  if (customerNote.trim()) {
    message += `\n📝 *Nota / Instrucciones:* ${customerNote.trim()}\n`
  }

  message += `\n¿Me confirman disponibilidad para coordinar la entrega y el pago? ¡Muchas gracias!`
  return message
}

export const buildCartCheckoutUrl = (
  items: CartItem[],
  deliveryMethod: DeliveryMethod = 'pickup',
  customerNote = '',
): string => buildWhatsAppUrl(buildCartOrderMessage(items, deliveryMethod, customerNote))
