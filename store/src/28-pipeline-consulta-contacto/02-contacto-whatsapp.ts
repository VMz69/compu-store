import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { buildWhatsAppUrl } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'

/** Mensaje y enlace de WhatsApp para el formulario de contacto. */

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
  return buildWhatsAppUrl(message)
}
