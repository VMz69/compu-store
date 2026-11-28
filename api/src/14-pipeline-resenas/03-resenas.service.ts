import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { obtenerProductosVendibles, type ProductoVendible } from '../06-pipeline-catalogo/00-director-catalogo.js'
import { obtenerIdentidad } from '../08-pipeline-tienda/00-director-tienda.js'
import type { EnviarResena, ListarResenas, ModerarResena } from './02-resenas.schema.js'
import * as repo from './04-resenas.repository.js'

/* ---------- Contrato ---------- */

/** Lo que ve el cliente en la ficha: sin estado, producto ni datos de moderación. */
export interface ResenaPublicaDto {
  id: number
  autor: string
  ciudad: string
  calificacion: number
  comentario: string
  creadoEn: string
}

/** Bandeja de moderación (= `ProductReview` del admin). */
export interface ResenaDto extends ResenaPublicaDto {
  /** `id` null si el producto se eliminó: quedan el SKU y el nombre del snapshot. */
  producto: { id: number | null; sku: string; nombre: string }
  estado: repo.ResenaFila['estado']
  moderadoPor: string | null
  moderadoEn: string | null
  motivoRechazo: string
}

const aPublica = (r: repo.ResenaFila): ResenaPublicaDto => ({
  id: r.id,
  autor: r.autor,
  ciudad: r.ciudad,
  calificacion: r.calificacion,
  comentario: r.comentario,
  creadoEn: r.creadoEn.toISOString(),
})

const aResena = (r: repo.ResenaFila): ResenaDto => ({
  ...aPublica(r),
  producto: { id: r.productoId, sku: r.productoSku, nombre: r.productoNombre },
  estado: r.estado,
  moderadoPor: r.moderadoPor,
  moderadoEn: r.moderadoEn ? r.moderadoEn.toISOString() : null,
  motivoRechazo: r.motivoRechazo,
})

export interface Operador {
  id: number
  nombre: string
}

/* ---------- Reglas ---------- */

/** Ventana del antispam por duplicado (D-13): la misma opinión dentro de 24 h no se guarda otra vez. */
const VENTANA_DUPLICADO_MS = 24 * 60 * 60 * 1000

const noEncontrada = (id: number) => new ErrorApp('NOT_FOUND', 404, `La reseña ${id} no existe.`)

/** Solo los productos publicados reciben y muestran reseñas (404 como su ficha). */
async function exigirPublicado(id: number): Promise<ProductoVendible> {
  const [producto] = await obtenerProductosVendibles([id])
  if (!producto?.publicado) throw new ErrorApp('NOT_FOUND', 404, `El producto ${id} no existe.`)
  return producto
}

/* ---------- Tienda ---------- */

export async function listarAprobadas(productoId: number, paginacion: Paginacion): Promise<{ data: ResenaPublicaDto[]; meta: MetaPaginacion }> {
  await exigirPublicado(productoId)
  const [filas, total] = await repo.aprobadasDe(productoId, paginacion)
  return { data: filas.map(aPublica), meta: meta(paginacion, total) }
}

/**
 * Toda opinión entra «pendiente» y no se publica hasta que el admin la apruebe. Un duplicado
 * reciente responde igual pero no se guarda (antispam, D-13): el remitente no distingue un caso del otro.
 */
export async function enviar(productoId: number, datos: EnviarResena): Promise<{ estado: 'pendiente' }> {
  const producto = await exigirPublicado(productoId)
  const desde = new Date(Date.now() - VENTANA_DUPLICADO_MS)
  if (!(await repo.duplicada(productoId, datos.autor, datos.comentario, desde))) {
    await repo.crear({
      productoId,
      productoSku: producto.sku,
      productoNombre: producto.nombre,
      autor: datos.autor,
      // Vacía → el país de la identidad (= `buildPendingReview` del store).
      ciudad: datos.ciudad || (await obtenerIdentidad()).pais,
      calificacion: datos.calificacion,
      comentario: datos.comentario,
    })
  }
  return { estado: 'pendiente' }
}

/* ---------- Admin ---------- */

export async function listar({ estado, ...paginacion }: ListarResenas): Promise<{ data: ResenaDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(estado, paginacion)
  return { data: filas.map(aResena), meta: meta(paginacion, total) }
}

const ESTADO_TEXTO = { pendiente: 'pendiente', aprobada: 'publicada', rechazada: 'rechazada' } as const

/** Aprobar publica y rechazar oculta (desde cualquier otro estado); repetir el estado actual → 422. */
export async function moderar(id: number, cambio: ModerarResena, operador: Operador): Promise<ResenaDto> {
  const motivoRechazo = cambio.estado === 'rechazada' ? cambio.motivo : ''
  const cambiadas = await repo.moderar([id], cambio.estado, { moderadoPorId: operador.id, moderadoPor: operador.nombre, motivoRechazo })
  const resena = await repo.buscar(id)
  if (!resena) throw noEncontrada(id)
  if (cambiadas === 0) throw new ErrorApp('BUSINESS_RULE', 422, `La reseña ya está ${ESTADO_TEXTO[resena.estado]}.`)
  return aResena(resena)
}

/** «Aprobar N visibles»: todas deben existir (404); las ya aprobadas se dejan como están. */
export async function aprobarVarias(ids: number[], operador: Operador): Promise<ResenaDto[]> {
  const existentes = new Set((await repo.buscarVarias(ids)).map((r) => r.id))
  const faltante = ids.find((id) => !existentes.has(id))
  if (faltante !== undefined) throw noEncontrada(faltante)
  await repo.moderar(ids, 'aprobada', { moderadoPorId: operador.id, moderadoPor: operador.nombre, motivoRechazo: '' })
  return (await repo.buscarVarias(ids)).map(aResena)
}

/** Eliminación definitiva (deja de mostrarse en la tienda). */
export async function eliminar(id: number): Promise<void> {
  if ((await repo.eliminar(id)) === 0) throw noEncontrada(id)
}
