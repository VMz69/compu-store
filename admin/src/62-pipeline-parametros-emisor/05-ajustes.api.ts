import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORE_CONFIG, type StoreSettings } from '@/85-pipeline-identificadores-texto/03-store.config'

/**
 * Adaptador de Ajustes › Identidad (L10): `/admin/ajustes/identidad` ↔ `StoreSettings` del admin.
 * El servidor valida, normaliza y deriva WhatsApp; aquí solo se traduce (D-14, D-19).
 * El IVA es normativo y sigue siendo la constante del admin (no viaja).
 */

type Respuesta<T> = { data: T }

interface AjustesDto {
  nombre: string
  eslogan: string
  ciudad: string
  pais: string
  direccion: string
  telefonos: string[]
  whatsapp: string
  correo: string
  horario: string
  moneda: { codigo: string; simbolo: string; locale: string }
  emisor: {
    razonSocial: string
    nit: string
    nrc: string
    actividadEconomica: string
    tipoEstablecimiento: string
  }
  semillaFactura: number | null
}

const toSettings = (dto: AjustesDto): StoreSettings => ({
  name: dto.nombre,
  tagline: dto.eslogan,
  city: dto.ciudad,
  country: dto.pais,
  address: dto.direccion,
  phones: dto.telefonos,
  whatsappNumber: dto.whatsapp,
  email: dto.correo,
  schedule: dto.horario,
  currency: dto.moneda.codigo,
  currencySymbol: dto.moneda.simbolo,
  taxRate: STORE_CONFIG.taxRate,
  legalName: dto.emisor.razonSocial,
  nit: dto.emisor.nit,
  nrc: dto.emisor.nrc,
  economicActivity: dto.emisor.actividadEconomica,
  establishmentType: dto.emisor.tipoEstablecimiento,
  invoiceSeed: dto.semillaFactura,
})

const toAjustesDto = (s: StoreSettings) => ({
  nombre: s.name,
  correo: s.email,
  telefonos: s.phones,
  direccion: s.address,
  emisor: {
    razonSocial: s.legalName,
    nit: s.nit,
    nrc: s.nrc,
    actividadEconomica: s.economicActivity,
    tipoEstablecimiento: s.establishmentType,
  },
  semillaFactura: s.invoiceSeed,
})

export async function fetchSettings(): Promise<StoreSettings> {
  const { data } = await apiClient.get<Respuesta<AjustesDto>>('/admin/ajustes/identidad')
  return toSettings(data.data)
}

export async function saveSettingsApi(settings: StoreSettings): Promise<StoreSettings> {
  const { data } = await apiClient.put<Respuesta<AjustesDto>>('/admin/ajustes/identidad', toAjustesDto(settings))
  return toSettings(data.data)
}
