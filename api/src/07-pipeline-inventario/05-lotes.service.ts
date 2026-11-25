import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import type { LoteRecibido } from './02-inventario.schema.js'
import * as repo from './04-inventario.repository.js'

export type Accion = 'creado' | 'ajustado' | 'retirado'

/** Motivo automático de un movimiento de lote; el número queda en el texto aunque el lote se borre después. */
export type MotivoLote = (numero: string, accion: Accion) => string

export const motivoLote: MotivoLote = (numero, accion) => `Lote ${numero}: ${accion}`

const aFecha = (vence: string | null) => (vence ? new Date(`${vence}T00:00:00.000Z`) : null)
const mismaFecha = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null)

/**
 * Deja los lotes del producto iguales a `recibidos` (por `id`: sin id = nuevo; ausente = retirado)
 * y registra un movimiento con `loteId` por cada cambio de cantidad. Devuelve el stock resultante (Σ lotes, D-16).
 * Debe llamarse con la fila del producto bloqueada (o recién creada) dentro de `tx`.
 */
export async function reconciliar(
  tx: repo.Tx,
  productoId: number,
  recibidos: LoteRecibido[],
  usuarioId: number,
  motivo: MotivoLote = motivoLote,
): Promise<number> {
  const actuales = new Map((await repo.lotesDe(tx, productoId)).map((lote) => [lote.id, lote]))
  const ajenos = recibidos.filter((r) => r.id !== undefined && !actuales.has(r.id))
  if (ajenos.length > 0) {
    throw new ErrorApp('BUSINESS_RULE', 422, `El lote ${ajenos[0]?.numero ?? ''} no pertenece a este producto: recarga la ficha.`)
  }

  const movimiento = (loteId: number, delta: number, numero: string, accion: Accion): repo.MovimientoNuevo => ({
    productoId,
    loteId,
    delta,
    motivo: motivo(numero, accion),
    usuarioId,
  })

  // Retirados: el movimiento se registra antes de borrar el lote (luego su loteId queda en null).
  const conservados = new Set(recibidos.flatMap((r) => r.id ?? []))
  const retirados = [...actuales.values()].filter((lote) => !conservados.has(lote.id))
  await repo.registrarMovimientos(
    tx,
    retirados.filter((l) => l.cantidad > 0).map((l) => movimiento(l.id, -l.cantidad, l.numero, 'retirado')),
  )
  await repo.eliminarLotes(
    tx,
    retirados.map((l) => l.id),
  )

  const movimientos: repo.MovimientoNuevo[] = []
  for (const recibido of recibidos) {
    const datos = { numero: recibido.numero, cantidad: recibido.cantidad, vence: aFecha(recibido.vence) }
    const actual = recibido.id !== undefined ? actuales.get(recibido.id) : undefined
    if (!actual) {
      const { id } = await repo.crearLote(tx, productoId, datos)
      if (datos.cantidad > 0) movimientos.push(movimiento(id, datos.cantidad, datos.numero, 'creado'))
      continue
    }
    if (actual.numero === datos.numero && actual.cantidad === datos.cantidad && mismaFecha(actual.vence, datos.vence)) continue
    await repo.actualizarLote(tx, actual.id, datos)
    const delta = datos.cantidad - actual.cantidad
    if (delta !== 0) movimientos.push(movimiento(actual.id, delta, datos.numero, 'ajustado'))
  }
  await repo.registrarMovimientos(tx, movimientos)

  return recibidos.reduce((suma, lote) => suma + lote.cantidad, 0)
}
