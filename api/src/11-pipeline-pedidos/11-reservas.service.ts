import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { liberar, registrarPuertoReservas, reservar, type Faltante } from '../07-pipeline-inventario/00-director-inventario.js'
import { hoyNegocio } from '../10-pipeline-ofertas/00-director-ofertas.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'
import * as ajustes from './04-ajustes-ventas.repository.js'
import { puedeTransicionar } from './05-flujo.js'
import * as repo from './09-pedidos.repository.js'
import type { PedidoBloqueado, Tx } from './09-pedidos.repository.js'

/**
 * Reservas de stock (L14, funcionalidades 23–25). «Confirmar y reservar» pasa el pedido de Registrado a
 * Reservado (`confirmado`) y aparta sus unidades hasta `reservadoHasta` (inclusive, calendario de
 * El Salvador). Vencimiento (D-07): barrido periódico + en línea (cualquier operación sobre el pedido, y la
 * liberación perezosa de inventario antes de calcular el disponible). Al vencer vuelve a Registrado.
 */

/** = `RESERVATION.maxDays` del admin. */
export const MAX_DIAS_RESERVA = 15

/** Quien reserva; `id` null para el seed. */
export interface OperadorReserva {
  id: number | null
  nombre: string
}

const regla = (mensaje: string, details?: unknown) => new ErrorApp('BUSINESS_RULE', 422, mensaje, details)

/** `YYYY-MM-DD` → `dd/mm/aaaa` (para el historial). */
const fechaCorta = (iso: string) => iso.split('-').reverse().join('/')
const aFecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

export function sumarDias(iso: string, dias: number): string {
  const fecha = aFecha(iso)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

const formatoAnio = new Intl.DateTimeFormat('en-US', { timeZone: 'America/El_Salvador', year: 'numeric' })

/** Id visible del admin: `ORD-{año de registro}-###`. */
export const idVisible = (id: number, creadoEn: Date) => `ORD-${formatoAnio.format(creadoEn)}-${String(id).padStart(3, '0')}`

/** 422 de stock con el detalle por línea (`lineas.<productoId>`); lo comparten el registro y la reserva. */
export function errorStock(faltantes: Faltante[]): ErrorApp {
  return regla(
    'Stock insuficiente: revisa las cantidades.',
    faltantes.map(({ productoId, disponible }) => ({
      campo: `lineas.${productoId}`,
      mensaje: disponible === 0 ? 'Sin stock disponible: quita el producto.' : `Solo hay ${disponible} disponible(s); ajusta la cantidad.`,
    })),
  )
}

const lineasReserva = async (tx: Tx, pedidoId: number) =>
  (await repo.lineasDe(tx, pedidoId)).map(({ productoId, cantidad }) => ({ productoId, cantidad }))

export const reservaVencida = (p: Pick<PedidoBloqueado, 'estado' | 'reservadoHasta'>, hoy: string): boolean =>
  p.estado === 'confirmado' && p.reservadoHasta !== null && p.reservadoHasta < hoy

/** Vence un pedido ya bloqueado: libera sus unidades y vuelve a Registrado («Sistema» en el historial). */
async function vencer(tx: Tx, pedido: PedidoBloqueado): Promise<void> {
  await liberar(tx, await lineasReserva(tx, pedido.id))
  await repo.fijarReserva(tx, pedido.id, null, {
    estado: 'registrado',
    usuarioId: null,
    por: 'Sistema',
    nota: `Reserva vencida (${fechaCorta(pedido.reservadoHasta as string)}): stock liberado`,
  })
}

/**
 * Vencimiento en línea: si el pedido bloqueado tiene la reserva caducada (el barrido aún no pasó),
 * se vence ahora y se devuelve ya en Registrado.
 */
export async function alDia(tx: Tx, pedido: PedidoBloqueado, hoy: string = hoyNegocio()): Promise<PedidoBloqueado> {
  if (!reservaVencida(pedido, hoy)) return pedido
  await vencer(tx, pedido)
  return { ...pedido, estado: 'registrado', reservadoHasta: null }
}

/** Vence (dentro de `tx`) las reservas caducadas: las de esos productos o, sin `productoIds`, todas. */
export async function vencerEnTx(tx: Tx, productoIds?: number[], hoy: string = hoyNegocio()): Promise<number[]> {
  const caducadas = await repo.vencidas(tx, hoy, productoIds)
  for (const pedido of caducadas) await vencer(tx, pedido)
  return caducadas.map((p) => p.id)
}

/** Barrido completo en su propia transacción. Idempotente y seguro con ejecuciones simultáneas. */
export const barrerReservasVencidas = (hoy?: string): Promise<number[]> => repo.transaccion((tx) => vencerEnTx(tx, undefined, hoy))

/** Barrido periódico dentro del proceso (D-07): al arrancar y cada `intervaloMs`. Devuelve cómo detenerlo. */
export function iniciarBarridoReservas(intervaloMs = 60_000): () => void {
  const correr = () =>
    barrerReservasVencidas()
      .then((ids) => {
        if (ids.length > 0) console.log(`Reservas vencidas liberadas: pedidos ${ids.join(', ')}`)
      })
      .catch((error: unknown) => console.error('El barrido de reservas falló:', error instanceof Error ? error.message : error))
  void correr()
  const temporizador = setInterval(() => void correr(), intervaloMs)
  temporizador.unref()
  return () => clearInterval(temporizador)
}

async function nombresEstado(): Promise<Record<EstadoPedido, string>> {
  const filas = await ajustes.listarEtiquetas()
  return Object.fromEntries(filas.map((f) => [f.estado, f.nombre])) as Record<EstadoPedido, string>
}

/**
 * «Confirmar y reservar» dentro de `tx` (la ruta y el seed). Bloquea el pedido y, con él, las filas de sus
 * productos: de dos reservas simultáneas sobre la última unidad, la segunda ve la primera y recibe 422.
 * Idempotente: repetir la misma reserva no aparta nada más.
 */
export async function reservarEnTx(tx: Tx, id: number, hasta: string, operador: OperadorReserva): Promise<void> {
  const hoy = hoyNegocio()
  const bloqueado = await repo.bloquear(tx, id)
  if (!bloqueado) throw new ErrorApp('NOT_FOUND', 404, 'El pedido no existe o fue eliminado.')
  const actual = await alDia(tx, bloqueado, hoy)
  if (actual.estado === 'confirmado' && actual.reservadoHasta === hasta) return

  if (!puedeTransicionar(actual.estado, 'confirmado')) {
    const nombres = await nombresEstado()
    throw regla(`No se puede pasar de "${nombres[actual.estado]}" a "${nombres.confirmado}".`)
  }
  if (hasta < hoy) throw regla('La fecha de la reserva no puede ser anterior a hoy.')
  if (hasta > sumarDias(hoy, MAX_DIAS_RESERVA)) throw regla(`Máximo ${MAX_DIAS_RESERVA} días de reserva.`)

  const faltantes = await reservar(tx, await lineasReserva(tx, id))
  if (faltantes.length > 0) throw errorStock(faltantes)
  await repo.fijarReserva(tx, id, aFecha(hasta), {
    estado: 'confirmado',
    usuarioId: operador.id,
    por: operador.nombre,
    nota: `Reservado hasta ${fechaCorta(hasta)}`,
  })
}

/** Registra en inventario el vencimiento perezoso y los pedidos que reservan (se llama al crear la app). */
export function conectarReservas(): void {
  registrarPuertoReservas({
    vencer: async (tx, productoIds) => {
      await vencerEnTx(tx, productoIds)
    },
    reservantes: async (tx, productoId) =>
      (await repo.reservantes(tx, productoId)).map(({ cantidad, pedido }) => ({ pedido: idVisible(pedido.id, pedido.creadoEn), cantidad })),
  })
}
