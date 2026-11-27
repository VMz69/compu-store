import { randomBytes, randomUUID } from 'node:crypto'
import { Prisma } from '../../generated/prisma/client.js'
import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { descontar, reponer, type ConsumoLote, type ConsumoVenta } from '../07-pipeline-inventario/00-director-inventario.js'
import { obtenerEmisor, type EmisorDto } from '../08-pipeline-tienda/00-director-tienda.js'
import { hoyNegocio } from '../10-pipeline-ofertas/00-director-ofertas.js'
import {
  bloquearParaAnular,
  idVisible,
  marcarFacturado,
  tomarParaFacturar,
  volverAReservado,
  type OperadorReserva,
  type PedidoParaFacturar,
} from '../11-pipeline-pedidos/00-director-pedidos.js'
import type { DatosEmision, EstadoFactura } from './02-facturas.schema.js'
import * as repo from './04-facturas.repository.js'
import type { FacturaFila, Tx } from './04-facturas.repository.js'
import { FACTURA_CONTROL, FACTURA_INTERNO, MAX_INTERNO, numeroControl, siguiente, textoInterno } from './05-correlativos.js'

/**
 * Facturación interna (L15, funcionalidades 33–36 y 12). Emitir y anular son una sola transacción que
 * coordina pedidos, inventario y los correlativos (§3.1.6). Orden de bloqueo: emitir = pedido → correlativos
 * → productos; anular = factura → pedido → productos. Los documentos emitidos son inmutables (§3.2).
 */

/** Quien emite o anula; `id` null para el seed. */
export type Operador = OperadorReserva

/** Contrato de la factura. El admin la traduce a `Invoice` (id = número de control). Dinero como string (D-05). */
export interface FacturaDto {
  id: number
  numeroControl: string
  correlativo: number
  codigoGeneracion: string
  /** Simulado: no hay transmisión a Hacienda (fuera de alcance). */
  selloRecepcion: string
  pedido: { id: number; visible: string }
  receptor: { consumidorFinal: boolean; nombre: string; documento: string; direccion: string; correo: string; telefono: string }
  condicionPago: string
  notas: string
  emisor: EmisorDto
  lineas: {
    id: number
    tipo: 'producto' | 'cargo'
    productoId: number | null
    sku: string | null
    descripcion: string
    unidad: string
    cantidad: number
    precioUnitario: string
    /** En dólares. */
    descuento: string
    importe: string
  }[]
  total: string
  estado: EstadoFactura
  creadaEn: string
  creadaPor: string
  anuladaEn: string | null
  anuladaPor: string | null
}

const aFactura = (f: FacturaFila): FacturaDto => ({
  id: f.id,
  numeroControl: f.numeroControl,
  correlativo: f.correlativo,
  codigoGeneracion: f.codigoGeneracion,
  selloRecepcion: f.selloRecepcion,
  pedido: { id: f.pedido.id, visible: idVisible(f.pedido.id, f.pedido.creadoEn) },
  receptor: {
    consumidorFinal: f.consumidorFinal,
    nombre: f.receptorNombre,
    documento: f.receptorDocumento,
    direccion: f.receptorDireccion,
    correo: f.receptorCorreo,
    telefono: f.receptorTelefono,
  },
  condicionPago: f.condicionPago,
  notas: f.notas,
  emisor: f.emisor as unknown as EmisorDto,
  lineas: f.lineas.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    productoId: l.productoId,
    sku: l.sku,
    descripcion: l.descripcion,
    unidad: l.unidad,
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario.toFixed(2),
    descuento: l.descuento.toFixed(2),
    importe: l.importe.toFixed(2),
  })),
  total: f.total.toFixed(2),
  estado: f.estado,
  creadaEn: f.creadaEn.toISOString(),
  creadaPor: f.creadaPor,
  anuladaEn: f.anuladaEn?.toISOString() ?? null,
  anuladaPor: f.anuladaPor,
})

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'La factura no existe.')
const regla = (mensaje: string) => new ErrorApp('BUSINESS_RULE', 422, mensaje)
const D = Prisma.Decimal

/* ---------- Lectura ---------- */

export async function listarFacturas(estado: EstadoFactura | undefined, paginacion: Paginacion): Promise<{ data: FacturaDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(estado, paginacion)
  return { data: filas.map(aFactura), meta: meta(paginacion, total) }
}

export async function obtenerFactura(id: number): Promise<FacturaDto> {
  const factura = await repo.buscar(id)
  if (!factura) throw noExiste()
  return aFactura(factura)
}

/* ---------- Emisión ---------- */

/** Receptor del documento: «Consumidor Final» o identificado; el teléfono sale del pedido. */
function receptorDe(datos: DatosEmision['receptor'], pedido: PedidoParaFacturar) {
  const base = datos.consumidorFinal
    ? { receptorNombre: 'Consumidor Final', receptorDocumento: '', receptorDireccion: 'Ciudad' }
    : { receptorNombre: datos.nombre, receptorDocumento: datos.documento, receptorDireccion: datos.direccion || pedido.ciudad }
  return { consumidorFinal: datos.consumidorFinal, ...base, receptorCorreo: datos.correo, receptorTelefono: pedido.clienteTelefono }
}

/**
 * Líneas copiadas del pedido: los productos con su snapshot (el descuento pactado pasa a dólares:
 * precio × cantidad − importe) y los cargos como servicios sin inventario. Importes del servidor.
 */
function lineasDe(pedido: PedidoParaFacturar, consumos: Map<number, ConsumoLote[] | null>): repo.LineaNueva[] {
  return [
    ...pedido.lineas.map((l) => {
      const lotes = consumos.get(l.productoId) ?? null
      return {
        tipo: 'producto' as const,
        productoId: l.productoId,
        sku: l.sku,
        descripcion: l.nombre,
        unidad: 'Unidad',
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuento: new D(l.precioUnitario).mul(l.cantidad).minus(l.importe).toFixed(2),
        importe: l.importe,
        ...(lotes ? { lotes: lotes as unknown as Prisma.InputJsonValue } : {}),
      }
    }),
    ...pedido.cargos.map((c) => ({
      tipo: 'cargo' as const,
      descripcion: c.concepto,
      unidad: 'Servicio',
      cantidad: 1,
      precioUnitario: c.monto,
      descuento: '0.00',
      importe: c.monto,
    })),
  ]
}

/** Sello de recepción SIMULADO (40 caracteres, como el de Hacienda): año + 36 hexadecimales. */
const selloSimulado = (hoy: string) => `${hoy.slice(0, 4)}${randomBytes(18).toString('hex').toUpperCase()}`

/**
 * Emite la factura de un pedido Reservado con la reserva vigente, dentro de `tx` (la ruta y el seed): descuenta
 * el inventario (stock y reserva, FEFO), toma los correlativos y pasa el pedido a Facturado. Doble emisión: la
 * segunda encuentra el pedido ya Facturado (422) y, como red, el índice único `pedidoActivoId` la rechaza.
 */
export async function emitirEnTx(tx: Tx, datos: DatosEmision, operador: Operador, emisor: Awaited<ReturnType<typeof obtenerEmisor>>): Promise<number> {
  const hoy = hoyNegocio()
  const pedido = await tomarParaFacturar(tx, datos.pedidoId, hoy)
  const interno = await siguiente(tx, FACTURA_INTERNO, emisor.semillaFactura, MAX_INTERNO)
  const control = await siguiente(tx, FACTURA_CONTROL)
  const texto = textoInterno(interno)

  const consumos: ConsumoVenta[] = await descontar(
    tx,
    pedido.lineas.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
    { motivo: `Venta · Factura ${texto} (${pedido.visible})`, usuarioId: operador.id },
  )
  const lineas = lineasDe(pedido, new Map(consumos.map((c) => [c.productoId, c.lotes])))
  const total = lineas.reduce((acc, l) => acc.plus(l.importe as string), new D(0)).toFixed(2)

  const id = await repo.crear(tx, {
    numeroControl: numeroControl(control),
    correlativo: interno,
    codigoGeneracion: randomUUID().toUpperCase(),
    selloRecepcion: selloSimulado(hoy),
    pedidoId: pedido.id,
    pedidoActivoId: pedido.id,
    ...receptorDe(datos.receptor, pedido),
    condicionPago: datos.condicionPago,
    notas: datos.notas,
    emisor: emisor.emisor as unknown as Prisma.InputJsonValue,
    total,
    creadaPorId: operador.id,
    creadaPor: operador.nombre,
  }, lineas)
  await marcarFacturado(tx, pedido.id, operador, `Factura ${texto}`)
  return id
}

export async function emitirFactura(datos: DatosEmision, operador: Operador): Promise<FacturaDto> {
  const emisor = await obtenerEmisor()
  const id = await repo.transaccion((tx) => emitirEnTx(tx, datos, operador, emisor))
  return obtenerFactura(id)
}

/* ---------- Anulación ---------- */

/**
 * Anula una factura emitida: repone exactamente lo vendido (a los mismos lotes), la factura conserva su número
 * y deja de ser la activa, y el pedido vuelve a Reservado por 3 días (para facturarse de nuevo o cancelarse).
 * No procede si el pedido ya se entregó.
 */
export async function anularFactura(id: number, operador: Operador & { id: number }): Promise<FacturaDto> {
  await repo.transaccion(async (tx) => {
    const factura = await repo.bloquear(tx, id)
    if (!factura) throw noExiste()
    if (factura.estado === 'anulada') throw regla('La factura ya está anulada.')
    const visible = await bloquearParaAnular(tx, factura.pedidoId)
    const texto = textoInterno(factura.correlativo)

    const lineas = (await repo.buscar(id, tx))?.lineas ?? []
    const consumos: ConsumoVenta[] = lineas.flatMap((l) =>
      l.tipo === 'producto' && l.productoId !== null
        ? [{ productoId: l.productoId, cantidad: l.cantidad, lotes: (l.lotes as unknown as ConsumoLote[] | null) ?? null }]
        : [],
    )
    await reponer(tx, consumos, { motivo: `Anulación · Factura ${texto} (${visible})`, usuarioId: operador.id, loteReposicion: `ANUL-${texto}` })
    await repo.anular(tx, id, operador)
    await volverAReservado(tx, factura.pedidoId, operador, `Factura ${texto} anulada`)
  })
  return obtenerFactura(id)
}
