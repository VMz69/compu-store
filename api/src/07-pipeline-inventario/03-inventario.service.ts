import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import type { EdicionExistencias, LoteRecibido } from './02-inventario.schema.js'
import * as repo from './04-inventario.repository.js'
import * as lotes from './05-lotes.service.js'
import { errorStockReservado, liberarVencidas, vencerReservas } from './06-reservas.service.js'

/* ---------- Contrato ---------- */

/** Existencias de un producto (la parte de inventario de contratos-A §4.2). */
export interface ExistenciasDto {
  productoId: number
  stock: number
  controlLotes: boolean
  lotes: { id: number; numero: string; cantidad: number; vence: string | null }[]
}

const aDto = (e: repo.Existencias): ExistenciasDto => ({
  productoId: e.id,
  stock: e.stock,
  controlLotes: e.controlLotes,
  lotes: e.lotes.map((l) => ({ id: l.id, numero: l.numero, cantidad: l.cantidad, vence: l.vence ? l.vence.toISOString().slice(0, 10) : null })),
})

/* ---------- Reglas ---------- */

const noEncontrado = (id: number) => new ErrorApp('NOT_FOUND', 404, `El producto ${id} no existe.`)

/** Motivo automático del ajuste rápido (decisión del propietario: el motivo lo fija el origen, no el navegador). */
const motivoAjuste = (delta: number) => `Ajuste rápido (${delta > 0 ? '+' : '−'}${Math.abs(delta)})`

async function exigirBloqueado(tx: repo.Tx, id: number): Promise<repo.ProductoBloqueado> {
  const producto = await repo.bloquearProducto(tx, id)
  if (!producto) throw noEncontrado(id)
  return producto
}

export async function obtenerExistencias(id: number): Promise<ExistenciasDto> {
  const existencias = await repo.existencias(id)
  if (!existencias) throw noEncontrado(id)
  return aDto(existencias)
}

/** Métricas de inventario (misma fórmula que `getInventoryMetrics` del admin; valoración a precio de venta). */
export const metricas = (): Promise<repo.Metricas> => repo.metricas()

/**
 * Unidades disponibles por producto (§5): físico − reservado (L14, mismo contrato que en A). Antes de leer
 * vence las reservas caducadas de esos productos (D-07). Los ids inexistentes no aparecen en el mapa.
 */
export async function obtenerDisponibilidad(ids: number[]): Promise<Map<number, number>> {
  const unicos = [...new Set(ids)]
  let filas = await repo.stockDe(unicos)
  const conReserva = filas.filter((fila) => fila.reservado > 0).map((fila) => fila.id)
  if (conReserva.length > 0) {
    await liberarVencidas(conReserva)
    filas = await repo.stockDe(unicos)
  }
  return new Map(filas.map((fila) => [fila.id, Math.max(0, fila.stock - fila.reservado)]))
}

/** El stock físico nunca queda por debajo de lo reservado por pedidos (L14). */
async function exigirCubreReservado(tx: repo.Tx, producto: repo.ProductoBloqueado, stock: number): Promise<void> {
  if (stock < producto.reservado) throw await errorStockReservado(tx, producto.id, producto.reservado)
}

/* ---------- Escritura ---------- */

/** Ajuste ±n de un producto sin lotes. El stock nunca queda negativo, aun con peticiones simultáneas. */
export async function ajustar(productoId: number, delta: number, usuarioId: number): Promise<ExistenciasDto> {
  await repo.transaccion(async (tx) => {
    await vencerReservas(tx, [productoId])
    const producto = await exigirBloqueado(tx, productoId)
    if (producto.controlLotes) {
      throw new ErrorApp('BUSINESS_RULE', 422, 'El stock de este producto se controla por lotes: ajústalo desde la ficha.')
    }
    const stock = producto.stock + delta
    if (stock < 0) {
      throw new ErrorApp('BUSINESS_RULE', 422, `Stock insuficiente: hay ${producto.stock} y se intentan restar ${-delta}.`)
    }
    await exigirCubreReservado(tx, producto, stock)
    await repo.fijarStock(tx, productoId, stock)
    await repo.registrarMovimientos(tx, [{ productoId, loteId: null, delta, motivo: motivoAjuste(delta), usuarioId }])
  })
  return obtenerExistencias(productoId)
}

const MOTIVO_ALTA = 'Alta de producto'

/** Existencias con las que nace un producto (alta en catálogo). */
export type ExistenciasIniciales = { controlLotes: false; stock: number } | { controlLotes: true; lotes: LoteRecibido[] }

/**
 * Registra el stock inicial de un producto recién creado, dentro de la transacción del alta
 * (catálogo coordina, §3.1.6). Cada unidad que entra queda como movimiento del usuario.
 */
export async function registrarExistenciasIniciales(
  tx: repo.Tx,
  productoId: number,
  datos: ExistenciasIniciales,
  usuarioId: number,
): Promise<void> {
  if (datos.controlLotes) {
    const stock = await lotes.reconciliar(tx, productoId, datos.lotes, usuarioId, (numero) => `${MOTIVO_ALTA} (lote ${numero})`)
    await repo.fijarStock(tx, productoId, stock, true)
    return
  }
  if (datos.stock === 0) return
  await repo.fijarStock(tx, productoId, datos.stock, false)
  await repo.registrarMovimientos(tx, [{ productoId, loteId: null, delta: datos.stock, motivo: MOTIVO_ALTA, usuarioId }])
}

const MOTIVO_EDICION = 'Edición de existencias'
const MOTIVO_A_LOTES = 'Paso a control por lotes'
const MOTIVO_A_MANUAL = 'Paso a stock manual'

/**
 * Edición desde la ficha: stock manual o lotes. Cada diferencia queda como movimiento
 * (al cambiar de modo, primero sale el saldo anterior y luego entra el nuevo), así Σ movimientos = stock.
 */
export async function editarExistencias(productoId: number, datos: EdicionExistencias, usuarioId: number): Promise<ExistenciasDto> {
  await repo.transaccion(async (tx) => {
    await vencerReservas(tx, [productoId])
    const producto = await exigirBloqueado(tx, productoId)
    if (producto.stock !== datos.stockEsperado) {
      throw new ErrorApp(
        'CONFLICT',
        409,
        `Las existencias cambiaron mientras editabas (stock actual: ${producto.stock}). Recarga la ficha y vuelve a intentarlo.`,
      )
    }
    const movimiento = (delta: number, motivo: string): repo.MovimientoNuevo => ({ productoId, loteId: null, delta, motivo, usuarioId })

    if (datos.controlLotes) {
      if (!producto.controlLotes && producto.stock > 0) await repo.registrarMovimientos(tx, [movimiento(-producto.stock, MOTIVO_A_LOTES)])
      const stock = await lotes.reconciliar(tx, productoId, datos.lotes, usuarioId)
      await exigirCubreReservado(tx, producto, stock)
      await repo.fijarStock(tx, productoId, stock, true)
      return
    }

    await exigirCubreReservado(tx, producto, datos.stock)
    if (producto.controlLotes) {
      // Desactivar lotes: salen todos los lotes y entra el stock manual indicado.
      await lotes.reconciliar(tx, productoId, [], usuarioId)
      if (datos.stock > 0) await repo.registrarMovimientos(tx, [movimiento(datos.stock, MOTIVO_A_MANUAL)])
    } else if (datos.stock !== producto.stock) {
      await repo.registrarMovimientos(tx, [movimiento(datos.stock - producto.stock, MOTIVO_EDICION)])
    }
    await repo.fijarStock(tx, productoId, datos.stock, false)
  })
  return obtenerExistencias(productoId)
}
