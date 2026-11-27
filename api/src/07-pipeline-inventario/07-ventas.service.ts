import * as repo from './04-inventario.repository.js'

/**
 * Movimientos por venta y anulación (L15, funcionalidad 12). Los usa facturación dentro de su transacción
 * (§3.1.6), después de bloquear el pedido: aquí se bloquean las filas de los productos en orden de id (L14).
 *
 * - Vender un pedido reservado descuenta el stock y su reserva a la vez: el disponible no cambia.
 * - Con lotes, se descuenta por FEFO (vencimiento más próximo primero, los que no vencen al final; = `consumeLots`
 *   del admin) y se devuelve qué lotes se consumieron, para que la anulación reponga exactamente a esos lotes.
 */

export interface LineaVenta {
  productoId: number
  cantidad: number
}

/** Unidades tomadas de un lote; `numero` y `vence` permiten recrearlo si se retiró antes de anular. */
export interface ConsumoLote {
  loteId: number
  numero: string
  /** `YYYY-MM-DD` o null. */
  vence: string | null
  cantidad: number
}

/** Lo que salió de un producto: `lotes` null si el producto no llevaba control por lotes. */
export interface ConsumoVenta extends LineaVenta {
  lotes: ConsumoLote[] | null
}

export interface ContextoMovimiento {
  /** Motivo automático del movimiento («Venta · Factura 015782»). */
  motivo: string
  usuarioId: number | null
  /** Número del lote que se crea si hay que reponer a un producto con lotes sin lote de origen. */
  loteReposicion: string
}

const isoDe = (fecha: Date | null) => (fecha ? fecha.toISOString().slice(0, 10) : null)
const aFecha = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00.000Z`) : null)

const agrupar = (lineas: LineaVenta[]) => {
  const suma = new Map<number, number>()
  for (const { productoId, cantidad } of lineas) suma.set(productoId, (suma.get(productoId) ?? 0) + cantidad)
  return [...suma.entries()].sort(([a], [b]) => a - b)
}

/** Un descuadre (reserva o lotes que no cubren la venta) aborta la transacción (500) en vez de ocultarse. */
const descuadre = (mensaje: string) => new Error(mensaje)

/**
 * Descuenta las unidades vendidas de un pedido reservado. Devuelve el consumo por producto (con sus lotes).
 * Las unidades deben estar reservadas: el pedido las apartó al confirmarse y facturar solo procede con la
 * reserva vigente.
 */
export async function descontar(tx: repo.Tx, lineas: LineaVenta[], ctx: Omit<ContextoMovimiento, 'loteReposicion'>): Promise<ConsumoVenta[]> {
  const grupos = agrupar(lineas)
  const filas = new Map((await repo.bloquearProductos(tx, grupos.map(([id]) => id))).map((f) => [f.id, f]))
  const consumos: ConsumoVenta[] = []
  const movimientos: repo.MovimientoNuevo[] = []

  for (const [productoId, cantidad] of grupos) {
    const fila = filas.get(productoId)
    if (!fila) throw descuadre(`El producto ${productoId} no existe.`)
    if (fila.reservado < cantidad || fila.stock < cantidad) throw descuadre(`Reserva descuadrada en el producto ${productoId}.`)
    await repo.fijarExistencias(tx, productoId, fila.stock - cantidad, fila.reservado - cantidad)

    if (!fila.controlLotes) {
      consumos.push({ productoId, cantidad, lotes: null })
      movimientos.push({ productoId, loteId: null, delta: -cantidad, motivo: ctx.motivo, usuarioId: ctx.usuarioId })
      continue
    }
    const actuales = await repo.lotesDe(tx, productoId)
    const cantidades = new Map(actuales.map((l) => [l.id, l.cantidad]))
    const lotes = consumirFefo(actuales, cantidad, productoId)
    for (const lote of lotes) {
      await repo.fijarCantidadLote(tx, lote.loteId, (cantidades.get(lote.loteId) ?? 0) - lote.cantidad)
      movimientos.push({ productoId, loteId: lote.loteId, delta: -lote.cantidad, motivo: ctx.motivo, usuarioId: ctx.usuarioId })
    }
    consumos.push({ productoId, cantidad, lotes })
  }

  await repo.registrarMovimientos(tx, movimientos)
  return consumos
}

type LoteFila = Awaited<ReturnType<typeof repo.lotesDe>>[number]

/** FEFO: vencimiento ascendente, los que no vencen al final; a igual fecha, el más antiguo (id). */
function consumirFefo(lotes: LoteFila[], cantidad: number, productoId: number): ConsumoLote[] {
  const orden = [...lotes].sort((a, b) => (isoDe(a.vence) ?? '9999').localeCompare(isoDe(b.vence) ?? '9999') || a.id - b.id)
  const consumo: ConsumoLote[] = []
  let pendiente = cantidad
  for (const lote of orden) {
    if (pendiente === 0) break
    const toma = Math.min(lote.cantidad, pendiente)
    if (toma === 0) continue
    consumo.push({ loteId: lote.id, numero: lote.numero, vence: isoDe(lote.vence), cantidad: toma })
    pendiente -= toma
  }
  if (pendiente > 0) throw descuadre(`Los lotes del producto ${productoId} no cubren la venta.`)
  return consumo
}

/**
 * Repone exactamente lo que salió con `descontar` (anulación). Solo el stock: volver a reservar es cosa del
 * pedido. Con lotes, a los mismos lotes; si uno se retiró, se recrea con su número y vencimiento. Si el producto
 * pasó a lotes después de la venta, se crea el lote `ctx.loteReposicion`; si dejó los lotes, va al stock.
 */
export async function reponer(tx: repo.Tx, consumos: ConsumoVenta[], ctx: ContextoMovimiento): Promise<void> {
  const ordenados = [...consumos].sort((a, b) => a.productoId - b.productoId)
  const filas = new Map((await repo.bloquearProductos(tx, ordenados.map((c) => c.productoId))).map((f) => [f.id, f]))
  const movimientos: repo.MovimientoNuevo[] = []

  for (const { productoId, cantidad, lotes } of ordenados) {
    const fila = filas.get(productoId)
    if (!fila) throw descuadre(`El producto ${productoId} no existe.`)
    await repo.fijarExistencias(tx, productoId, fila.stock + cantidad, fila.reservado)
    fila.stock += cantidad
    const mov = (loteId: number | null, delta: number) => movimientos.push({ productoId, loteId, delta, motivo: ctx.motivo, usuarioId: ctx.usuarioId })

    if (!fila.controlLotes) {
      mov(null, cantidad)
      continue
    }
    const destino = lotes ?? [{ loteId: 0, numero: ctx.loteReposicion, vence: null, cantidad }]
    for (const lote of destino) {
      const actual = (await repo.lotesDe(tx, productoId)).find((l) => l.id === lote.loteId)
      if (actual) {
        await repo.fijarCantidadLote(tx, actual.id, actual.cantidad + lote.cantidad)
        mov(actual.id, lote.cantidad)
      } else {
        const { id } = await repo.crearLote(tx, productoId, { numero: lote.numero, cantidad: lote.cantidad, vence: aFecha(lote.vence) })
        mov(id, lote.cantidad)
      }
    }
  }

  await repo.registrarMovimientos(tx, movimientos)
}
