import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { CrearOferta, EditarOferta, TipoDescuento } from './02-ofertas.schema.js'
import * as repo from './04-ofertas.repository.js'
import type { OfertaFila, Tx } from './04-ofertas.repository.js'
import { hoyNegocio, preciosDeOfertas } from './05-precio-efectivo.js'

/** Contrato de la oferta (L12). El admin lo traduce a `Offer` (id `PRM-###`). */
export interface OfertaDto {
  id: number
  titulo: string
  etiqueta: string
  descripcion: string
  tipoDescuento: TipoDescuento
  valor: string
  inicio: string
  fin: string
  pausada: boolean
  /** Precio de oferta de cada producto con su precio base actual (el mismo cálculo que la tienda). */
  productos: { productoId: number; precioOferta: string }[]
  creadaEn: string
}

export type EstadoOferta = 'vigente' | 'programada' | 'pausada' | 'vencida'

/* ---------- Fechas de calendario ---------- */

/** `YYYY-MM-DD` ↔ columna DATE (medianoche UTC, sin zona: es una fecha de calendario). */
const aFechaBD = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`)
const aFechaTexto = (fecha: Date) => fecha.toISOString().slice(0, 10)

/** Estado derivado, como `offerStatus` del admin: vencida › pausada › programada › vigente. */
export function estadoOferta(o: { inicio: string; fin: string; pausada: boolean }, hoy: string = hoyNegocio()): EstadoOferta {
  if (o.fin < hoy) return 'vencida'
  if (o.pausada) return 'pausada'
  return o.inicio > hoy ? 'programada' : 'vigente'
}

const estadoDeFila = (o: OfertaFila, hoy: string) =>
  estadoOferta({ inicio: aFechaTexto(o.inicio), fin: aFechaTexto(o.fin), pausada: o.pausada }, hoy)

/* ---------- DTO ---------- */

async function aDtos(filas: OfertaFila[]): Promise<OfertaDto[]> {
  const precios = await preciosDeOfertas(filas.map((o) => o.id))
  return filas.map((o) => ({
    id: o.id,
    titulo: o.titulo,
    etiqueta: o.etiqueta,
    descripcion: o.descripcion,
    tipoDescuento: o.tipoDescuento,
    valor: o.valor.toFixed(2),
    inicio: aFechaTexto(o.inicio),
    fin: aFechaTexto(o.fin),
    pausada: o.pausada,
    productos: precios.get(o.id) ?? [],
    creadaEn: o.creadaEn.toISOString(),
  }))
}

const aDto = async (fila: OfertaFila): Promise<OfertaDto> => (await aDtos([fila]))[0] as OfertaDto

/* ---------- Reglas ---------- */

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'La oferta no existe.')
const invalido = (campo: string, mensaje: string) => new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', [{ campo, mensaje }])
const regla = (mensaje: string) => new ErrorApp('BUSINESS_RULE', 422, mensaje)

async function exigirOferta(id: number): Promise<OfertaFila> {
  const oferta = await repo.buscar(id)
  if (!oferta) throw noExiste()
  return oferta
}

interface Propuesta {
  tipoDescuento: TipoDescuento
  valor: string
  inicio: string
  fin: string
  productoIds: number[]
}

/** Reglas que combinan campos: se evalúan con los valores resultantes (también al editar). */
function validarCampos(p: Propuesta): void {
  if (p.tipoDescuento === 'porcentaje' && Number(p.valor) > 90) throw invalido('valor', 'Máximo 90%.')
  if (p.fin < p.inicio) throw invalido('fin', 'La fecha de fin debe ser igual o posterior al inicio.')
}

/**
 * Reglas sobre los productos, con sus filas bloqueadas: existen, el precio de oferta es mayor que 0,
 * ninguno queda bajo su costo y no se solapan con otra oferta no vencida.
 */
async function validarProductos(tx: Tx, p: Propuesta, hoy: string, exceptoId?: number): Promise<void> {
  const evaluados = await repo.bloquearYEvaluar(tx, p.productoIds, p.tipoDescuento, p.valor)
  const encontrados = new Set(evaluados.map((e) => e.id))
  const faltante = p.productoIds.find((id) => !encontrados.has(id))
  if (faltante !== undefined) throw regla(`El producto ${faltante} no existe.`)

  const gratis = evaluados.filter((e) => Number(e.precioOferta) <= 0).length
  if (gratis) throw regla(`${gratis} producto(s) quedarían en $0.00. Baja el descuento o quítalos.`)
  const bajoCosto = evaluados.filter((e) => e.margen !== null && Number(e.margen) < 0).length
  if (bajoCosto) throw regla(`${bajoCosto} producto(s) quedarían bajo su costo. Baja el descuento o quítalos.`)

  const otra = await repo.buscarSolapada(
    tx,
    { ...(exceptoId ? { exceptoId } : {}), inicio: aFechaBD(p.inicio), fin: aFechaBD(p.fin), productoIds: p.productoIds },
    aFechaBD(hoy),
  )
  if (otra) {
    throw new ErrorApp('CONFLICT', 409, `${otra.productoIds.length} producto(s) ya están en "${otra.titulo}" en esas fechas.`)
  }
}

/* ---------- Casos de uso ---------- */

export async function listarOfertas(paginacion: Paginacion): Promise<{ data: OfertaDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(paginacion)
  return { data: await aDtos(filas), meta: meta(paginacion, total) }
}

export const obtenerOferta = async (id: number): Promise<OfertaDto> => aDto(await exigirOferta(id))

export async function crearOferta(datos: CrearOferta): Promise<OfertaDto> {
  const hoy = hoyNegocio()
  validarCampos(datos)
  if (datos.fin < hoy) throw regla('La oferta terminaría en el pasado.')
  const { productoIds, inicio, fin, ...resto } = datos
  const fila = await repo.transaccion(async (tx) => {
    await validarProductos(tx, datos, hoy)
    return repo.crear(tx, { ...resto, inicio: aFechaBD(inicio), fin: aFechaBD(fin) }, productoIds)
  })
  return aDto(fila)
}

export async function editarOferta(id: number, cambios: EditarOferta): Promise<OfertaDto> {
  const hoy = hoyNegocio()
  const actual = await exigirOferta(id)
  if (estadoDeFila(actual, hoy) === 'vencida') throw regla('Una oferta vencida es historial: no se puede editar.')

  const propuesta: Propuesta = {
    tipoDescuento: cambios.tipoDescuento ?? actual.tipoDescuento,
    valor: cambios.valor ?? actual.valor.toFixed(2),
    inicio: cambios.inicio ?? aFechaTexto(actual.inicio),
    fin: cambios.fin ?? aFechaTexto(actual.fin),
    productoIds: cambios.productoIds ?? actual.productos.map((p) => p.productoId),
  }
  validarCampos(propuesta)

  const { productoIds, inicio, fin, ...resto } = cambios
  const datos = { ...resto, inicio: inicio ? aFechaBD(inicio) : undefined, fin: fin ? aFechaBD(fin) : undefined }
  const fila = await repo.transaccion(async (tx) => {
    await validarProductos(tx, propuesta, hoy, id)
    return repo.actualizar(tx, id, datos, productoIds)
  })
  return aDto(fila)
}

/** Pausar o reanudar; una vencida ya no aplica, así que no se pausa ni se reanuda. */
export async function pausarOferta(id: number, pausada: boolean): Promise<OfertaDto> {
  const actual = await exigirOferta(id)
  if (estadoDeFila(actual, hoyNegocio()) === 'vencida') throw regla('La oferta está vencida: no se puede pausar ni reanudar.')
  return aDto(await repo.fijarPausa(id, pausada))
}

/** Una vigente se pausa antes de eliminarse (así nadie pierde un precio sin aviso). */
export async function eliminarOferta(id: number): Promise<void> {
  const actual = await exigirOferta(id)
  if (estadoDeFila(actual, hoyNegocio()) === 'vigente') throw regla('Pausa la oferta antes de eliminarla.')
  await repo.eliminar(id)
}
