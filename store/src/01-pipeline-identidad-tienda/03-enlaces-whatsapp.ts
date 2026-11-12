import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/01-identidad.config'

/**
 * Enlaces de WhatsApp genéricos (sin lógica de negocio).
 *
 * Cada feature construye su propio mensaje (pedido, producto, contacto) y usa
 * `buildWhatsAppUrl` para obtener el enlace. Así cambiar el formato de un
 * mensaje no toca la UI ni otros dominios.
 */

const WHATSAPP_BASE = `https://wa.me/${STORE_CONFIG.whatsappNumber}`

export const buildWhatsAppUrl = (message: string): string =>
  `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`

export const buildAssistantUrl = (): string =>
  buildWhatsAppUrl('¡Hola CompuStore SV! Necesito asistencia y asesoría con un producto.')
