import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { reservar } from '../07-pipeline-inventario/00-director-inventario.js'
import { hoyNegocio } from '../10-pipeline-ofertas/00-director-ofertas.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'
import * as ajustes from './04-ajustes-ventas.repository.js'
import * as repo from './09-pedidos.repository.js'
import type { Tx } from './09-pedidos.repository.js'
import { alDia, errorStock, idVisible, sumarDias, type OperadorReserva } from './11-reservas.service.js'

/**
 * El pedido visto desde facturación (L15). Facturación coordina la transacción (§3.1.6) y llama a estas
 * funciones con su `tx`; pedidos no importa nada de facturación. Orden de bloqueo: pedido → productos (L14).
 */

/** = «volverá a "Reservado" por 3 días» del admin al anular. */
export const DIAS_RESERVA_ANULACION = 3

const regla = (mensaje: string) => new ErrorApp('BUSINESS_RULE', 422, mensaje)
const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'El pedido no existe o fue eliminado.')

async function nombresEstado(): Promise<Record<EstadoPedido, string>> {
  const filas = await ajustes.listarEtiquetas()
  return Object.fromEntries(filas.map((f) => [f.estado, f.nombre])) as Record<EstadoPedido, string>
}

/** Pedido listo para facturar: snapshot del cliente, líneas y cargos (importes del servidor). */
export interface PedidoParaFacturar {
  id: number
  /** `ORD-AAAA-###`. */
  visible: string
  clienteId: number | null
  clienteNombre: string
  clienteTelefono: string
  clienteCorreo: string
  ciudad: string
  formaPago: string
  total: string
  lineas: { productoId: number; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { id: number; concepto: string; monto: string }[]
}

/**
 * Bloquea el pedido y comprueba que se pueda facturar: Reservado con la reserva vigente (si caducó, se vence en
 * línea y el 422 lo dice). Reservado implica que no tiene factura activa (al facturar pasa a Facturado).
 */
export async function tomarParaFacturar(tx: Tx, id: number, hoy: string = hoyNegocio()): Promise<PedidoParaFacturar> {
  const bloqueado = await repo.bloquear(tx, id)
  if (!bloqueado) throw noExiste()
  const actual = await alDia(tx, bloqueado, hoy)
  if (actual.estado !== 'confirmado') {
    const nombres = await nombresEstado()
    const motivo =
      bloqueado.estado === 'confirmado'
        ? `La reserva del pedido venció: vuelve a reservarlo antes de facturar.`
        : actual.estado === 'facturado' || actual.estado === 'entregado'
          ? 'Este pedido ya fue facturado.'
          : `Un pedido en estado "${nombres[actual.estado]}" no se puede facturar. Solo se facturan pedidos "${nombres.confirmado}" con la reserva vigente.`
    throw regla(motivo)
  }
  const p = (await repo.buscar(id, tx)) as repo.PedidoFila
  return {
    id: p.id,
    visible: idVisible(p.id, p.creadoEn),
    clienteId: p.clienteId,
    clienteNombre: p.clienteNombre,
    clienteTelefono: p.clienteTelefono,
    clienteCorreo: p.clienteCorreo,
    ciudad: p.ciudad,
    formaPago: p.formaPago,
    total: p.total.toFixed(2),
    lineas: p.lineas.map((l) => ({
      productoId: l.productoId,
      sku: l.sku,
      nombre: l.nombre,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario.toFixed(2),
      descuento: l.descuento.toFixed(2),
      importe: l.importe.toFixed(2),
    })),
    cargos: p.cargos.map((c) => ({ id: c.id, concepto: c.concepto, monto: c.monto.toFixed(2) })),
  }
}

/** Reservado → Facturado (la reserva ya la consumió la venta). */
export async function marcarFacturado(tx: Tx, id: number, operador: OperadorReserva, nota: string): Promise<void> {
  await repo.cambiarEstado(tx, id, { estado: 'facturado', usuarioId: operador.id, por: operador.nombre, nota })
}

/**
 * Bloquea el pedido de una factura que se va a anular. Solo Facturado: si ya se entregó, la anulación no
 * procede desde el flujo normal (requeriría una devolución). Devuelve el id visible.
 */
export async function bloquearParaAnular(tx: Tx, id: number): Promise<string> {
  const bloqueado = await repo.bloquear(tx, id)
  if (!bloqueado) throw noExiste()
  const visible = idVisible(id, (await repo.buscar(id, tx))?.creadoEn ?? new Date())
  if (bloqueado.estado === 'entregado') {
    throw regla(`El pedido ${visible} ya fue entregado: la factura no se puede anular desde el flujo normal.`)
  }
  if (bloqueado.estado !== 'facturado') throw regla(`El pedido ${visible} no está facturado.`)
  return visible
}

/**
 * Facturado → Reservado hasta hoy + 3 tras anular la factura (con el stock ya repuesto, siempre alcanza).
 * Devuelve la fecha de la nueva reserva (`YYYY-MM-DD`).
 */
export async function volverAReservado(tx: Tx, id: number, operador: OperadorReserva, nota: string, hoy: string = hoyNegocio()): Promise<string> {
  const hasta = sumarDias(hoy, DIAS_RESERVA_ANULACION)
  const lineas = (await repo.lineasDe(tx, id)).map(({ productoId, cantidad }) => ({ productoId, cantidad }))
  const faltantes = await reservar(tx, lineas)
  if (faltantes.length > 0) throw errorStock(faltantes)
  await repo.fijarReserva(tx, id, new Date(`${hasta}T00:00:00.000Z`), {
    estado: 'confirmado',
    usuarioId: operador.id,
    por: operador.nombre,
    nota: `${nota} · Reservado hasta ${hasta.split('-').reverse().join('/')}`,
  })
  return hasta
}
