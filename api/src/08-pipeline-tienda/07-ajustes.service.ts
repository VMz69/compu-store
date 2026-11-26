import { aWhatsapp, type AjustesIdentidad } from './06-ajustes.schema.js'
import { aIdentidad, configuracionExistente, type IdentidadDto } from './03-tienda.service.js'
import * as repo from './04-tienda.repository.js'

/** Identidad pública + datos del emisor + semilla de facturas (Ajustes › Identidad, L10). */
export interface AjustesIdentidadDto extends IdentidadDto {
  emisor: {
    razonSocial: string
    nit: string
    nrc: string
    actividadEconomica: string
    tipoEstablecimiento: string
  }
  semillaFactura: number | null
}

const aAjustes = (c: repo.Configuracion): AjustesIdentidadDto => ({
  ...aIdentidad(c),
  emisor: {
    razonSocial: c.razonSocial,
    nit: c.nit,
    nrc: c.nrc,
    actividadEconomica: c.actividadEconomica,
    tipoEstablecimiento: c.tipoEstablecimiento,
  },
  semillaFactura: c.semillaFactura,
})

export async function obtener(): Promise<AjustesIdentidadDto> {
  return aAjustes(await configuracionExistente())
}

/**
 * Guarda la identidad editable. El servidor deriva WhatsApp (y su enlace en las redes) del
 * teléfono principal; los documentos ya emitidos conservan su propia copia del emisor (§3.2).
 */
export async function actualizar(entrada: AjustesIdentidad): Promise<AjustesIdentidadDto> {
  const actual = aIdentidad(await configuracionExistente())
  const whatsapp = aWhatsapp(entrada.telefonos[0] ?? '')
  const c = await repo.actualizarConfiguracion({
    nombre: entrada.nombre,
    correo: entrada.correo,
    telefonos: entrada.telefonos,
    whatsapp,
    redes: { ...actual.redes, whatsapp: `https://wa.me/${whatsapp}` },
    direccion: entrada.direccion,
    ...entrada.emisor,
    semillaFactura: entrada.semillaFactura,
  })
  return aAjustes(c)
}
