/**
 * Identidad pública de la tienda. No contiene datos de negocio: la rellena
 * `aplicarIdentidad` con `GET /tienda/identidad` (38-pipeline-datos-api) antes del
 * primer render, así que los componentes la leen ya cargada (L07B).
 */
export interface StoreConfig {
  name: string
  tagline: string
  city: string
  country: string
  address: string
  addressShort: string
  phones: string[]
  whatsappNumber: string
  email: string
  schedule: string
  scheduleShort: string
  about: string
  mission: string
  vision: string
  values: string[]
  socials: { facebook: string; instagram: string; tiktok: string; whatsapp: string }
  currency: { code: string; symbol: string; locale: string }
}

export const STORE_CONFIG: StoreConfig = {
  name: '',
  tagline: '',
  city: '',
  country: '',
  address: '',
  addressShort: '',
  phones: [],
  whatsappNumber: '',
  email: '',
  schedule: '',
  scheduleShort: '',
  about: '',
  mission: '',
  vision: '',
  values: [],
  socials: { facebook: '', instagram: '', tiktok: '', whatsapp: '' },
  currency: { code: '', symbol: '', locale: '' },
}

/** Reemplaza la identidad en el mismo objeto (los módulos que la importaron ven el cambio). */
export const aplicarIdentidad = (identidad: StoreConfig): void => {
  Object.assign(STORE_CONFIG, identidad)
}

/** Ciudad sin el departamento («Cojutepeque, Cuscatlán» → «Cojutepeque»), para mensajes cortos. */
export const getStoreCityName = (): string => STORE_CONFIG.city.split(',')[0]?.trim() ?? ''
