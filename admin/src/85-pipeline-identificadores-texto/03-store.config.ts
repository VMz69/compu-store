import { publicUrl } from '@/83-pipeline-recursos-publicos/00-director-recursos-publicos'

/** Identidad comercial de CompuStore SV (valores de fábrica, editables desde Ajustes). */
export interface StoreSettings {
  name: string
  tagline: string
  city: string
  country: string
  address: string
  phones: string[]
  whatsappNumber: string
  email: string
  schedule: string
  currency: string
  currencySymbol: string
  taxRate: number
  /** Datos del contribuyente emisor (obligatorios en la factura / DTE). */
  legalName: string
  nit: string
  nrc: string
  economicActivity: string
  establishmentType: string
  /**
   * Semilla del correlativo interno de facturas (ej. 15800 → "015800").
   * null = continuar la secuencia. Nunca retrocede: rige max(semilla, último emitido + 1).
   */
  invoiceSeed: number | null
}

export const STORE_CONFIG: StoreSettings = {
  name: 'CompuStore SV',
  tagline: 'COMPUTADORAS Y ACCESORIOS',
  city: 'Cojutepeque, Cuscatlán',
  country: 'El Salvador',
  address: 'Frente a Dollar City, 2da planta Farmacias Económicas, Cojutepeque, Cuscatlán.',
  phones: ['7038-8225', '6838-2232'],
  whatsappNumber: '50370388225',
  email: 'ventas@compustoresv.com',
  schedule: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0.13,
  legalName: 'COMPU STORE SAS DE CV',
  nit: '07181607251010',
  nrc: '367628-0',
  economicActivity: 'Venta al por menor de computadoras y equipo periférico',
  establishmentType: 'Casa matriz',
  invoiceSeed: null,
}

/** URL del Front Office (/store). Se configura en `.env` con VITE_STORE_URL. */
export const STORE_FRONT_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:5173'

export const LOGOS = {
  horizontal: publicUrl('logo/logo-horizontal.png'),
  onDark: publicUrl('logo/logo-bgBlack.png'),
  onDarkCropped: publicUrl('logo/logo-bgBlack-cropped.png'),
  iconOnDark: publicUrl('logo/icono-bgBlack.png'),
  iconOnLight: publicUrl('logo/icono-bgWhite.png'),
  icon: publicUrl('logo/icono.png'),
} as const
