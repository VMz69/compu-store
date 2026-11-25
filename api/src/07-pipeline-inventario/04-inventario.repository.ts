import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import type { Prisma } from '../../generated/prisma/client.js'

/** Cliente de Prisma dentro o fuera de una transacción. */
export type Tx = Prisma.TransactionClient

export interface ProductoBloqueado {
  id: number
  stock: number
  controlLotes: boolean
}

export interface MovimientoNuevo {
  productoId: number
  loteId: number | null
  delta: number
  motivo: string
  usuarioId: number | null
}

const EXISTENCIAS = {
  id: true,
  stock: true,
  controlLotes: true,
  lotes: { orderBy: { id: 'asc' }, select: { id: true, numero: true, cantidad: true, vence: true } },
} as const satisfies Prisma.ProductoSelect

export type Existencias = Prisma.ProductoGetPayload<{ select: typeof EXISTENCIAS }>

/* ---------- Lectura ---------- */

export const existencias = (id: number, cliente: Tx = prisma) =>
  cliente.producto.findUnique({ where: { id }, select: EXISTENCIAS })

export interface Metricas {
  total: number
  publicados: number
  stockBajo: number
  agotados: number
  /** Σ precio × stock, como string decimal (D-05). */
  valoracion: string
}

/** Métricas del catálogo completo en una sola consulta; stock bajo = 0 < stock ≤ puntoReorden. */
export async function metricas(): Promise<Metricas> {
  const [fila] = await prisma.$queryRaw<Record<keyof Metricas, number | bigint | string | null>[]>`
    SELECT COUNT(*) AS total,
           COALESCE(SUM(publicado), 0) AS publicados,
           COALESCE(SUM(stock > 0 AND stock <= puntoReorden), 0) AS stockBajo,
           COALESCE(SUM(stock = 0), 0) AS agotados,
           CAST(CAST(COALESCE(SUM(precio * stock), 0) AS DECIMAL(20, 2)) AS CHAR) AS valoracion
    FROM productos`
  return {
    total: Number(fila?.total ?? 0),
    publicados: Number(fila?.publicados ?? 0),
    stockBajo: Number(fila?.stockBajo ?? 0),
    agotados: Number(fila?.agotados ?? 0),
    valoracion: String(fila?.valoracion ?? '0.00'),
  }
}

/* ---------- Escritura (dentro de una transacción) ---------- */

/**
 * Bloquea la fila del producto hasta el fin de la transacción (`SELECT … FOR UPDATE`) y devuelve
 * su stock vigente: las escrituras de inventario sobre un mismo producto quedan serializadas.
 */
export async function bloquearProducto(tx: Tx, id: number): Promise<ProductoBloqueado | null> {
  const filas = await tx.$queryRaw<{ id: number; stock: number | bigint; controlLotes: number | boolean }[]>`
    SELECT id, stock, controlLotes FROM productos WHERE id = ${id} FOR UPDATE`
  const fila = filas[0]
  return fila ? { id: Number(fila.id), stock: Number(fila.stock), controlLotes: Boolean(fila.controlLotes) } : null
}

export const fijarStock = (tx: Tx, id: number, stock: number, controlLotes?: boolean) =>
  tx.producto.update({ where: { id }, data: { stock, ...(controlLotes !== undefined ? { controlLotes } : {}) }, select: { id: true } })

/* ---------- Lotes ---------- */

export interface DatosLote {
  numero: string
  cantidad: number
  vence: Date | null
}

export const lotesDe = (tx: Tx, productoId: number) =>
  tx.lote.findMany({ where: { productoId }, orderBy: { id: 'asc' }, select: { id: true, numero: true, cantidad: true, vence: true } })

export const crearLote = (tx: Tx, productoId: number, datos: DatosLote) =>
  tx.lote.create({ data: { productoId, ...datos }, select: { id: true } })

export const actualizarLote = (tx: Tx, id: number, datos: DatosLote) => tx.lote.update({ where: { id }, data: datos, select: { id: true } })

export const eliminarLotes = (tx: Tx, ids: number[]) =>
  ids.length === 0 ? Promise.resolve() : tx.lote.deleteMany({ where: { id: { in: ids } } }).then(() => undefined)

export const registrarMovimientos = (tx: Tx, movimientos: MovimientoNuevo[]) =>
  movimientos.length === 0 ? Promise.resolve() : tx.movimientoInventario.createMany({ data: movimientos }).then(() => undefined)

export const transaccion = <T>(trabajo: (tx: Tx) => Promise<T>) => prisma.$transaction(trabajo)
