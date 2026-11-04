import { STORE_CONFIG } from '@/data/storeConfig'
import { calculateSubtotal, calculateItemCount, getLineTotal } from '@/services/cart.service'
import { formatCurrency } from '@/services/formatters'
import type { CartItem, DeliveryMethod, Product } from '@/types'

/**
 * Construcción de mensajes y enlaces de WhatsApp.
 *
 * Mantener estos strings fuera de los componentes permite cambiar el formato
 * del pedido (por ejemplo, a una API de pedidos) sin tocar la UI.
 */

const WHATSAPP_BASE = `https://wa.me/${STORE_CONFIG.whatsappNumber}`

const buildUrl = (message: string): string => `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`

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

export const buildSingleProductMessage = (product: Product, quantity = 1): string => {
  let message = `👋 *¡Hola ${STORE_CONFIG.name}!* Me interesa comprar directamente el siguiente producto:\n\n`
  message += `💻 *${product.name}*\n`
  message += `• Cantidad: *${quantity}*\n`
  message += `• Precio unitario: *${formatCurrency(product.price)}*\n`
  message += `• Total: *${formatCurrency(product.price * quantity)}*\n\n`
  message += `¿Tienen disponibilidad inmediata para retiro en Cojutepeque o envío? ¡Gracias!`
  return message
}

export const buildCartCheckoutUrl = (
  items: CartItem[],
  deliveryMethod: DeliveryMethod = 'pickup',
  customerNote = '',
): string => buildUrl(buildCartOrderMessage(items, deliveryMethod, customerNote))

export const buildSingleProductUrl = (product: Product, quantity = 1): string =>
  buildUrl(buildSingleProductMessage(product, quantity))

export const buildContactUrl = (payload: {
  name: string
  phone?: string
  subject: string
  message: string
}): string => {
  let message = `👋 *¡Hola ${STORE_CONFIG.name}!*\n\n`
  message += `👤 *Nombre:* ${payload.name}\n`
  if (payload.phone) message += `📞 *Teléfono:* ${payload.phone}\n`
  message += `📌 *Asunto:* ${payload.subject}\n\n`
  message += `💬 *Mensaje:* ${payload.message}\n`
  return buildUrl(message)
}

export const buildAssistantUrl = (): string =>
  buildUrl('¡Hola CompuStore SV! Necesito asistencia y asesoría con un producto.')
