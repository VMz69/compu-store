import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
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
 * La semilla solo puede adelantar la numeración (L15, = `validateIdentity` del admin): debe ser mayor que el
 * último correlativo emitido. Aunque se colara una menor, la emisión toma máx(último + 1, semilla).
 */
async function semillaValida(semilla: number | null): Promise<void> {
  if (semilla === null) return
  const ultimo = await repo.ultimoCorrelativoFactura()
  if (semilla <= ultimo) {
    const texto = String(ultimo).padStart(6, '0')
    throw new ErrorApp('BUSINESS_RULE', 422, `Debe ser mayor que el último emitido (${texto}).`, [
      { campo: 'semillaFactura', mensaje: `Debe ser mayor que el último emitido (${texto}).` },
    ])
  }
}

/**
 * Guarda la identidad editable. El servidor deriva WhatsApp (y su enlace en las redes) del
 * teléfono principal; los documentos ya emitidos conservan su propia copia del emisor (§3.2).
 */
export async function actualizar(entrada: AjustesIdentidad): Promise<AjustesIdentidadDto> {
  const actual = aIdentidad(await configuracionExistente())
  await semillaValida(entrada.semillaFactura)
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
