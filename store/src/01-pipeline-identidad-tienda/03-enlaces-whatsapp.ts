import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/01-identidad.config'

/**
 * Enlaces de WhatsApp genéricos (sin lógica de negocio).
 *
 * Cada feature construye su propio mensaje (pedido, producto, contacto) y usa
 * `buildWhatsAppUrl` para obtener el enlace. Así cambiar el formato de un
 * mensaje no toca la UI ni otros dominios.
 */

/** Se calcula en cada llamada: el número llega de la API al arrancar (L07B). */
const whatsAppBase = (): string => `https://wa.me/${STORE_CONFIG.whatsappNumber}`

export const buildWhatsAppUrl = (message: string): string =>
  `${whatsAppBase()}?text=${encodeURIComponent(message)}`

export const buildAssistantUrl = (): string =>
  buildWhatsAppUrl(`¡Hola ${STORE_CONFIG.name}! Necesito asistencia y asesoría con un producto.`)
