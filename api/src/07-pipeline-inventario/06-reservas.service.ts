import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import * as repo from './04-inventario.repository.js'

/**
 * Stock reservado (L14): `productos.reservado` = unidades apartadas por pedidos reservados;
 * disponible = stock − reservado. Toda escritura bloquea las filas de los productos en orden de id.
 *
 * Los pedidos son de otro dominio (que ya depende de inventario): para vencer las reservas caducadas
 * antes de calcular el disponible (liberación perezosa, D-07) y para nombrar a los pedidos que reservan,
 * pedidos registra este puerto al crear la app. Sin puerto registrado no hace nada.
 */

export interface LineaReserva {
  productoId: number
  cantidad: number
}

/** Producto que no alcanza: unidades disponibles para este movimiento. */
export interface Faltante {
  productoId: number
  disponible: number
}

export interface Reservante {
  /** Id visible del pedido (`ORD-AAAA-###`). */
  pedido: string
  cantidad: number
}

export interface PuertoReservas {
  /** Vence (dentro de `tx`) las reservas caducadas de esos productos, o todas sin `productoIds`. */
  vencer: (tx: repo.Tx, productoIds?: number[]) => Promise<void>
  /** Pedidos con reserva vigente sobre el producto. */
  reservantes: (tx: repo.Tx, productoId: number) => Promise<Reservante[]>
}

const SIN_PUERTO: PuertoReservas = { vencer: async () => {}, reservantes: async () => [] }
let puerto: PuertoReservas = SIN_PUERTO

export const registrarPuertoReservas = (nuevo: PuertoReservas): void => {
  puerto = nuevo
}

/** Liberación perezosa dentro de una transacción ya abierta. */
export const vencerReservas = (tx: repo.Tx, productoIds: number[]): Promise<void> =>
  productoIds.length === 0 ? Promise.resolve() : puerto.vencer(tx, [...new Set(productoIds)])

/** Liberación perezosa en una transacción propia (antes de leer el disponible). */
export async function liberarVencidas(productoIds: number[]): Promise<void> {
  if (productoIds.length === 0) return
  await repo.transaccion((tx) => vencerReservas(tx, productoIds))
}

const porProducto = (lineas: LineaReserva[]) => {
  const suma = new Map<number, number>()
  for (const { productoId, cantidad } of lineas) suma.set(productoId, (suma.get(productoId) ?? 0) + cantidad)
  return suma
}

/**
 * Cambia la reserva de un pedido de `antes` a `despues` en una sola operación (alta: `antes` vacío;
 * liberación: `despues` vacío; edición: ambos). Vence primero las reservas caducadas de esos productos
 * y bloquea sus filas. Si algún producto no alcanza, no escribe nada y devuelve los faltantes.
 */
export async function moverReserva(tx: repo.Tx, antes: LineaReserva[], despues: LineaReserva[]): Promise<Faltante[]> {
  const menos = porProducto(antes)
  const mas = porProducto(despues)
  const ids = [...new Set([...menos.keys(), ...mas.keys()])].sort((a, b) => a - b)
  if (ids.length === 0) return []
  if (mas.size > 0) await vencerReservas(tx, [...mas.keys()])

  const filas = new Map((await repo.bloquearProductos(tx, ids)).map((f) => [f.id, f]))
  const cambios = ids.map((id) => {
    const fila = filas.get(id)
    const liberado = (fila?.reservado ?? 0) - (menos.get(id) ?? 0)
    return { id, fila, liberado, nuevo: liberado + (mas.get(id) ?? 0) }
  })

  const faltantes = cambios
    .filter(({ id, fila, nuevo }) => (mas.get(id) ?? 0) > 0 && (!fila || nuevo > fila.stock))
    .map(({ id, fila, liberado }) => ({ productoId: id, disponible: fila ? Math.max(0, fila.stock - liberado) : 0 }))
  if (faltantes.length > 0) return faltantes

  for (const { id, fila, liberado, nuevo } of cambios) {
    // Liberar más de lo reservado indicaría un descuadre: se aborta la transacción (500) en vez de ocultarlo.
    if (liberado < 0) throw new Error(`Reserva descuadrada en el producto ${id}.`)
    if (fila && nuevo !== fila.reservado) await repo.fijarReservado(tx, id, nuevo)
  }
  return []
}

export const reservar = (tx: repo.Tx, lineas: LineaReserva[]) => moverReserva(tx, [], lineas)

export async function liberar(tx: repo.Tx, lineas: LineaReserva[]): Promise<void> {
  await moverReserva(tx, lineas, [])
}

/**
 * 422 cuando un ajuste dejaría el stock por debajo de lo reservado: nombra los pedidos y el camino
 * (primero cancelar o reducir esos pedidos, luego ajustar).
 */
export async function errorStockReservado(tx: repo.Tx, productoId: number, reservado: number): Promise<ErrorApp> {
  const pedidos = await puerto.reservantes(tx, productoId)
  const quienes =
    pedidos.length === 0
      ? 'pedidos'
      : `${pedidos.length === 1 ? 'el pedido' : 'los pedidos'} ${pedidos.map((p) => `${p.pedido} (${p.cantidad})`).join(', ')}`
  return new ErrorApp(
    'BUSINESS_RULE',
    422,
    `Hay ${reservado} unidad(es) reservada(s) por ${quienes}: cancela o reduce esos pedidos y luego ajusta el stock (mínimo ${reservado}).`,
  )
}
