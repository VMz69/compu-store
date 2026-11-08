import { STORE_CONFIG } from '@/shared/config/store.config'
import { formatCurrency } from '@/shared/lib/formatters'
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp'
import type { Product } from '@/shared/types'

/** Mensaje y enlace de WhatsApp para la compra directa de un producto. */

export const buildSingleProductMessage = (product: Product, quantity = 1): string => {
  let message = `👋 *¡Hola ${STORE_CONFIG.name}!* Me interesa comprar directamente el siguiente producto:\n\n`
  message += `💻 *${product.name}*\n`
  message += `• Cantidad: *${quantity}*\n`
  message += `• Precio unitario: *${formatCurrency(product.price)}*\n`
  message += `• Total: *${formatCurrency(product.price * quantity)}*\n\n`
  message += `¿Tienen disponibilidad inmediata para retiro en Cojutepeque o envío? ¡Gracias!`
  return message
}

export const buildSingleProductUrl = (product: Product, quantity = 1): string =>
  buildWhatsAppUrl(buildSingleProductMessage(product, quantity))
