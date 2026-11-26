import { z } from 'zod'

/**
 * Identidad comercial y emisor (L10). Mismas reglas que `validateIdentity` del admin
 * (admin/src/62-pipeline-parametros-emisor/03-identity.ts). La regla «semilla mayor que la
 * última factura emitida» se completa en L15, cuando existan facturas.
 */

/** Tipos de establecimiento del catálogo de Hacienda (= `ESTABLISHMENT_TYPES` del admin). */
export const TIPOS_ESTABLECIMIENTO = ['Casa matriz', 'Sucursal / Agencia', 'Bodega', 'Predio y/o patio'] as const

const TELEFONO = /^[0-9+\-\s]{8,15}$/
const digitos = (valor: string) => valor.replace(/\D/g, '')

const telefono = z.string().trim().regex(TELEFONO, 'Teléfono no válido (ej. 7038-8225).')

const emisor = z.strictObject({
  razonSocial: z
    .string()
    .trim()
    .min(3, 'Ingresa la razón social registrada en Hacienda.')
    .max(100, 'Máximo 100 caracteres.')
    .transform((valor) => valor.toUpperCase()),
  // NIT de 14 dígitos o DUI homologado (9), con o sin guiones.
  nit: z
    .string()
    .trim()
    .max(17, 'NIT de 14 dígitos (o DUI homologado de 9).')
    .regex(/^[0-9-]+$/, 'NIT de 14 dígitos (o DUI homologado de 9).')
    .refine((valor) => [9, 14].includes(digitos(valor).length), 'NIT de 14 dígitos (o DUI homologado de 9).'),
  nrc: z.string().trim().regex(/^\d{1,7}-\d$/, 'Formato NRC: 367628-0'),
  actividadEconomica: z.string().trim().min(5, 'Indica la actividad económica (giro).').max(120, 'Máximo 120 caracteres.'),
  tipoEstablecimiento: z.enum(TIPOS_ESTABLECIMIENTO, 'Selecciona el tipo de establecimiento.'),
})

/** Lo que edita Ajustes › Identidad. WhatsApp, redes, moneda e IVA no viajan desde el navegador. */
export const esquemaAjustesIdentidad = z.strictObject({
  nombre: z.string().trim().min(3, 'Ingresa el nombre comercial.').max(80, 'Máximo 80 caracteres.'),
  correo: z.string().trim().toLowerCase().max(254).email('Correo no válido.'),
  telefonos: z.array(telefono).min(1, 'Teléfono obligatorio (ej. 7038-8225).').max(2, 'Máximo 2 teléfonos.'),
  direccion: z
    .string()
    .trim()
    .min(10, 'Escribe la dirección completa (mín. 10 caracteres).')
    .max(255, 'Máximo 255 caracteres.'),
  emisor,
  /** Próximo número de factura; null = continuar la secuencia. */
  semillaFactura: z.number().int('Número entero de 1 a 999999.').min(1, 'Número entero de 1 a 999999.').max(999_999, 'Número entero de 1 a 999999.').nullable(),
})
export type AjustesIdentidad = z.infer<typeof esquemaAjustesIdentidad>

/** Número de WhatsApp internacional a partir del teléfono principal (= `toWhatsappNumber` del admin). */
export const aWhatsapp = (telefonoPrincipal: string): string => {
  const d = digitos(telefonoPrincipal)
  return d.length === 8 ? `503${d}` : d
}
