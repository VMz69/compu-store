const SV_COUNTRY_CODE = '503'

/** Enlace a un chat de WhatsApp con un número salvadoreño local (ej. "7038-8225"). */
export const buildWhatsAppLink = (localPhone: string, message?: string): string => {
  const digits = localPhone.replace(/[^0-9]/g, '')
  const base = `https://wa.me/${SV_COUNTRY_CODE}${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Enlace a WhatsApp Web con un número internacional completo (ej. "50370388225"). */
export const buildWhatsAppWebLink = (fullNumber: string): string =>
  `https://wa.me/${fullNumber.replace(/[^0-9]/g, '')}`
