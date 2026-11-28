import { Prisma } from '../../generated/prisma/client.js'
import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { obtenerProductosVendibles } from '../06-pipeline-catalogo/00-director-catalogo.js'
import { obtenerEmisor, type EmisorDto } from '../08-pipeline-tienda/00-director-tienda.js'
import { obtenerClienteParaPedido } from '../09-pipeline-clientes/00-director-clientes.js'
import { hoyNegocio } from '../10-pipeline-ofertas/00-director-ofertas.js'
import {
  crearDesdeCotizacion,
  idVisible,
  importeLinea,
  obtenerPedido,
  totalPedido,
  type DatosPedido,
  type PedidoDto,
} from '../11-pipeline-pedidos/00-director-pedidos.js'
import { siguienteCorrelativo } from '../12-pipeline-facturacion/00-director-facturacion.js'
import type { DatosCotizacion, DestinoCotizacion } from './02-cotizaciones.schema.js'
import * as repo from './04-cotizaciones.repository.js'
import type { CotizacionFila, Tx } from './04-cotizaciones.repository.js'

/**
 * Cotizaciones (L16, funcionalidades 29–32): emisión con correlativo propio y precio del servidor,
 * estados (aceptar/rechazar), vencimiento derivado (D-07) y conversión a pedido con el precio cotizado
 * (D-18). Los importes usan la misma aritmética que los pedidos. El PDF lo genera el admin (D-11).
 */

/** Secuencia en `correlativos` (fila de la migración `cotizaciones`): una sola serie, no se reinicia con el año. */
export const SECUENCIA_COTIZACION = 'cotizacion'

const formatoAnio = new Intl.DateTimeFormat('en-US', { timeZone: 'America/El_Salvador', year: 'numeric' })

/** `COT-{año de emisión en El Salvador}-###` (= `QUOTE_ID_PREFIX` del admin, con el año real). */
export const codigoCotizacion = (numero: number, emitidaEn: Date) => `COT-${formatoAnio.format(emitidaEn)}-${String(numero).padStart(3, '0')}`

/** Último día de validez (inclusive): día de emisión en El Salvador + días de validez. */
export function validezHasta(emitidaEn: Date, dias: number): Date {
  const fecha = new Date(`${hoyNegocio(emitidaEn)}T00:00:00.000Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha
}

/** Quien emite o cambia la cotización; `id` null para el seed. */
export interface Operador {
  id: number | null
  nombre: string
}

export type EstadoEfectivo = 'emitida' | 'aceptada' | 'rechazada' | 'vencida' | 'convertida'

/** Contrato de la cotización. El admin la traduce a `Quote` (id = código). Dinero como string (D-05). */
export interface CotizacionDto {
  id: number
  numero: number
  codigo: string
  cliente: { id: number | null; nombre: string; telefono: string; correo: string; documento: string }
  lineas: { productoId: number | null; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { id: number; concepto: string; monto: string }[]
  notas: string
  validezDias: number
  /** Último día de validez (`YYYY-MM-DD`, inclusive). */
  validaHasta: string
  /** Estado guardado. */
  estado: 'emitida' | DestinoCotizacion
  /** Convertida (pedido activo) → vencida (emitida fuera de validez) → estado guardado, como `effectiveStatus`. */
  estadoEfectivo: EstadoEfectivo
  /** Emitida o aceptada, vigente y sin pedido activo. */
  convertible: boolean
  /** Pedido activo (no cancelado ni eliminado) que originó. */
  pedido: { id: number; visible: string } | null
  emisor: EmisorDto
  total: string
  creadaEn: string
  creadaPor: string
}

const aFecha = (d: Date) => d.toISOString().slice(0, 10)
const vigente = (c: Pick<CotizacionFila, 'validaHasta'>, hoy: string) => hoy <= aFecha(c.validaHasta)

function estadoEfectivo(c: CotizacionFila, hoy: string): EstadoEfectivo {
  if (c.pedidos.length > 0) return 'convertida'
  if (c.estado === 'emitida' && !vigente(c, hoy)) return 'vencida'
  return c.estado
}

function aCotizacion(c: CotizacionFila, hoy = hoyNegocio()): CotizacionDto {
  const pedido = c.pedidos[0]
  return {
    id: c.id,
    numero: c.numero,
    codigo: c.codigo,
    cliente: { id: c.clienteId, nombre: c.clienteNombre, telefono: c.clienteTelefono, correo: c.clienteCorreo, documento: c.clienteDocumento },
    lineas: c.lineas.map((l) => ({
      productoId: l.productoId,
      sku: l.sku,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario.toFixed(2),
      descuento: l.descuento.toFixed(2),
      importe: l.importe.toFixed(2),
    })),
    cargos: c.cargos.map((g) => ({ id: g.id, concepto: g.concepto, monto: g.monto.toFixed(2) })),
    notas: c.notas,
    validezDias: c.validezDias,
    validaHasta: aFecha(c.validaHasta),
    estado: c.estado,
    estadoEfectivo: estadoEfectivo(c, hoy),
    convertible: !pedido && c.estado !== 'rechazada' && vigente(c, hoy),
    pedido: pedido ? { id: pedido.id, visible: idVisible(pedido.id, pedido.creadoEn) } : null,
    emisor: c.emisor as unknown as EmisorDto,
    total: c.total.toFixed(2),
    creadaEn: c.creadaEn.toISOString(),
    creadaPor: c.creadaPor,
  }
}

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'La cotización no existe.')
const regla = (mensaje: string, details?: unknown) => new ErrorApp('BUSINESS_RULE', 422, mensaje, details)

/* ---------- Lectura ---------- */

export async function listarCotizaciones(paginacion: Paginacion): Promise<{ data: CotizacionDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(paginacion)
  const hoy = hoyNegocio()
  return { data: filas.map((f) => aCotizacion(f, hoy)), meta: meta(paginacion, total) }
}

export async function obtenerCotizacion(id: number): Promise<CotizacionDto> {
  const cotizacion = await repo.buscar(id)
  if (!cotizacion) throw noExiste()
  return aCotizacion(cotizacion)
}

/* ---------- Emisión ---------- */

type SnapshotCliente = Pick<repo.CotizacionNueva, 'clienteId' | 'clienteNombre' | 'clienteTelefono' | 'clienteCorreo' | 'clienteDocumento'>

/** Cliente del directorio (snapshot desde la BD, activo y no eliminado, = pedidos) u ocasional (del cuerpo). */
async function clienteDe(datos: DatosCotizacion): Promise<SnapshotCliente> {
  if (datos.clienteId === null) {
    const o = datos.cliente as NonNullable<DatosCotizacion['cliente']>
    return { clienteId: null, clienteNombre: o.nombre, clienteTelefono: o.telefono, clienteCorreo: o.correo, clienteDocumento: o.documento }
  }
  const c = await obtenerClienteParaPedido(datos.clienteId)
  if (!c) throw regla('El cliente no existe.')
  if (c.eliminado) throw regla('El cliente fue eliminado del directorio.')
  if (!c.activo) throw regla(`El cliente ${c.nombre} está inactivo.`)
  return { clienteId: c.id, clienteNombre: c.nombre, clienteTelefono: c.telefono, clienteCorreo: c.correo ?? '', clienteDocumento: c.documento ?? '' }
}

/** Líneas al precio efectivo de hoy (L12). Sin tope de stock: se cotiza «bajo pedido». 422 si un producto no existe. */
async function lineasDe(datos: DatosCotizacion): Promise<repo.CotizacionNueva['lineas']> {
  const vendibles = new Map((await obtenerProductosVendibles(datos.lineas.map((l) => l.productoId))).map((p) => [p.id, p]))
  const faltantes = datos.lineas.filter((l) => !vendibles.has(l.productoId))
  if (faltantes.length > 0) {
    throw regla(
      'Hay productos que ya no existen.',
      faltantes.map((l) => ({ campo: `lineas.${l.productoId}`, mensaje: 'El producto no existe.' })),
    )
  }
  return datos.lineas.map((l) => {
    const p = vendibles.get(l.productoId) as NonNullable<ReturnType<typeof vendibles.get>>
    const base = { sku: p.sku, nombre: p.nombre, precioUnitario: p.precio }
    return { productoId: l.productoId, ...base, cantidad: l.cantidad, descuento: l.descuento, importe: importeLinea({ ...base, ...l }) }
  })
}

/**
 * Emite: valida cliente y productos, y después toma el número dentro de la transacción (un rollback no
 * deja huecos). El emisor se copia como snapshot; el autor es el usuario autenticado.
 */
export async function emitirCotizacion(datos: DatosCotizacion, operador: Operador): Promise<CotizacionDto> {
  const cliente = await clienteDe(datos)
  const lineas = await lineasDe(datos)
  const { emisor } = await obtenerEmisor()
  const id = await repo.transaccion(async (tx) => {
    const numero = await siguienteCorrelativo(tx, SECUENCIA_COTIZACION)
    const ahora = new Date()
    return repo.crear(tx, {
      numero,
      codigo: codigoCotizacion(numero, ahora),
      ...cliente,
      notas: datos.notas,
      validezDias: datos.validezDias,
      validaHasta: validezHasta(ahora, datos.validezDias),
      emisor: emisor as unknown as Prisma.InputJsonValue,
      total: totalPedido(lineas, datos.cargos),
      creadaEn: ahora,
      creadaPorId: operador.id,
      creadaPor: operador.nombre,
      lineas,
      cargos: datos.cargos,
    })
  })
  return obtenerCotizacion(id)
}

/* ---------- Estados, eliminación y conversión ---------- */

async function bloqueada(tx: Tx, id: number): Promise<CotizacionFila> {
  const fila = await repo.bloquear(tx, id)
  if (!fila) throw noExiste()
  return fila
}

/** Aceptar o rechazar: solo una emitida, vigente y sin pedido (= botones de `QuoteRow`). */
export async function cambiarEstado(id: number, estado: DestinoCotizacion): Promise<CotizacionDto> {
  await repo.transaccion(async (tx) => {
    const c = await bloqueada(tx, id)
    const actual = estadoEfectivo(c, hoyNegocio())
    if (actual !== 'emitida') throw regla(`La cotización ${c.codigo} está ${actual}: solo se acepta o rechaza una emitida y vigente.`)
    await repo.fijarEstado(tx, id, estado)
  })
  return obtenerCotizacion(id)
}

/** Borrado real si nunca originó un pedido; con alguno (también cancelado o eliminado) → 409. */
export async function eliminarCotizacion(id: number): Promise<void> {
  await repo.transaccion(async (tx) => {
    const c = await bloqueada(tx, id)
    const pedido = await repo.ultimoPedido(tx, id)
    if (pedido) {
      throw new ErrorApp('CONFLICT', 409, `No se puede eliminar: la cotización ${c.codigo} originó el pedido ${idVisible(pedido.id, pedido.creadoEn)}.`)
    }
    await repo.eliminar(tx, id)
  })
}

/**
 * Cotización → pedido (D-18). Una sola transacción: bloquea la cotización, comprueba que se puede convertir
 * (sin pedido activo, no rechazada y dentro de `validaHasta`, también si está aceptada) y registra el pedido
 * con las reglas de pedidos. Las líneas cotizadas conservan su precio; las demás toman el precio vigente.
 */
export async function convertir(id: number, datos: DatosPedido, operador: Operador & { id: number }): Promise<PedidoDto> {
  const pedidoId = await repo.transaccion(async (tx) => {
    const c = await bloqueada(tx, id)
    const activo = c.pedidos[0]
    if (activo) throw regla(`La cotización ${c.codigo} ya originó el pedido ${idVisible(activo.id, activo.creadoEn)}.`)
    if (c.estado === 'rechazada') throw regla(`La cotización ${c.codigo} está rechazada: no se puede convertir.`)
    if (!vigente(c, hoyNegocio())) throw regla(`La cotización ${c.codigo} está vencida: emite una nueva cotización.`)
    const cotizadas = new Map(
      c.lineas
        .filter((l): l is typeof l & { productoId: number } => l.productoId !== null)
        .map((l) => [l.productoId, { sku: l.sku, nombre: l.nombre, precioUnitario: l.precioUnitario.toFixed(2) }]),
    )
    return crearDesdeCotizacion(tx, { id: c.id, codigo: c.codigo, lineas: cotizadas }, datos, operador)
  })
  return obtenerPedido(pedidoId)
}
