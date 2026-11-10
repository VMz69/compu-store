/**
 * Datos del EMISOR que se imprimen en cotizaciones y facturas (lógica pura).
 *
 * Origen de cada campo en los documentos:
 *  · Encabezado (cotización y factura): nombre comercial, dirección, teléfonos, correo.
 *  · Bloque "Datos del emisor" de la factura (DTE): razón social, NIT, NRC,
 *    actividad económica y tipo de establecimiento.
 *  · IVA: normativa (13%), no se edita aquí.
 * Los documentos ya emitidos guardan su propia copia: editar no los altera.
 */
// `type` (no `interface`) para ser compatible con `useFormState` (índice de strings).
export type IdentityValues = {
  name: string
  email: string
  phone: string
  phone2: string
  address: string
  legalName: string
  nit: string
  nrc: string
  economicActivity: string
  establishmentType: string
}

/** Tipos de establecimiento del catálogo de Hacienda para el DTE. */
export const ESTABLISHMENT_TYPES = ['Casa matriz', 'Sucursal / Agencia', 'Bodega', 'Predio y/o patio']

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[0-9+\-\s]{8,15}$/
/** NRC: hasta 7 dígitos, guion y dígito verificador (ej. 367628-0). */
const NRC = /^\d{1,7}-\d$/
const digits = (v: string) => v.replace(/\D/g, '')

export function validateIdentity(v: IdentityValues): Record<string, string> {
  const e: Record<string, string> = {}
  if (v.name.trim().length < 3) e.name = 'Ingresa el nombre comercial.'
  if (!EMAIL.test(v.email.trim())) e.email = 'Correo no válido.'
  if (!PHONE.test(v.phone.trim())) e.phone = 'Teléfono obligatorio (ej. 7038-8225).'
  if (v.phone2.trim() && !PHONE.test(v.phone2.trim())) e.phone2 = 'Teléfono no válido.'
  if (v.address.trim().length < 10) e.address = 'Escribe la dirección completa (mín. 10 caracteres).'
  if (v.legalName.trim().length < 3) e.legalName = 'Ingresa la razón social registrada en Hacienda.'
  // NIT de 14 dígitos o DUI homologado (9 dígitos), con o sin guiones.
  if (![9, 14].includes(digits(v.nit).length)) e.nit = 'NIT de 14 dígitos (o DUI homologado de 9).'
  if (!NRC.test(v.nrc.trim())) e.nrc = 'Formato NRC: 367628-0'
  if (v.economicActivity.trim().length < 5) e.economicActivity = 'Indica la actividad económica (giro).'
  if (!v.establishmentType) e.establishmentType = 'Selecciona el tipo de establecimiento.'
  return e
}

/** Número de WhatsApp en formato internacional a partir del teléfono principal. */
export const toWhatsappNumber = (phone: string): string => {
  const d = digits(phone)
  return d.length === 8 ? `503${d}` : d
}
