import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { TipoDescuento } from './02-ofertas.schema.js'
import { aImporte, sqlPrecioOferta } from './05-precio-efectivo.js'

export type Tx = Prisma.TransactionClient

const CON_PRODUCTOS = { productos: { select: { productoId: true }, orderBy: { productoId: 'asc' } } } as const

export type OfertaFila = Prisma.OfertaGetPayload<{ include: typeof CON_PRODUCTOS }>

export interface DatosOferta {
  titulo: string
  etiqueta: string
  descripcion: string
  tipoDescuento: TipoDescuento
  valor: string
  inicio: Date
  fin: Date
  pausada: boolean
}

/* ---------- Lectura ---------- */

/** Las más recientes primero; el admin ordena por estado en el cliente. */
export const listar = (paginacion: Paginacion) =>
  prisma.$transaction([
    prisma.oferta.findMany({ ...rango(paginacion), orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }], include: CON_PRODUCTOS }),
    prisma.oferta.count(),
  ])

export const buscar = (id: number, cliente: Tx | typeof prisma = prisma) =>
  cliente.oferta.findUnique({ where: { id }, include: CON_PRODUCTOS })

/* ---------- Reglas (dentro de la transacción) ---------- */

export interface ProductoEvaluado {
  id: number
  /** Precio con el descuento propuesto (la misma fórmula del precio efectivo). */
  precioOferta: string
  /** Margen en $ sobre el precio sin IVA; null si el producto no tiene costo. */
  margen: string | null
}

/**
 * Bloquea las filas de los productos (`SELECT … FOR UPDATE`, por id) y evalúa el descuento propuesto.
 * Dos ofertas que comparten productos quedan serializadas, así que la comprobación de
 * solapamiento de la segunda ve la primera ya guardada. Los ids inexistentes no aparecen.
 */
export async function bloquearYEvaluar(tx: Tx, ids: number[], tipo: TipoDescuento, valor: string): Promise<ProductoEvaluado[]> {
  const precioOferta = sqlPrecioOferta(Prisma.sql`p.precio`, Prisma.sql`${tipo}`, Prisma.sql`CAST(${valor} AS DECIMAL(12, 2))`)
  const filas = await tx.$queryRaw<{ id: number; precioOferta: unknown; margen: unknown }[]>`
    SELECT p.id, ${precioOferta} AS precioOferta,
           ROUND(${precioOferta} / (1 + p.tasaIva / 100) - p.costo, 2) AS margen
    FROM productos p
    WHERE p.id IN (${Prisma.join(ids)})
    ORDER BY p.id
    FOR UPDATE`
  return filas.map((f) => ({
    id: Number(f.id),
    precioOferta: aImporte(f.precioOferta),
    margen: f.margen === null ? null : aImporte(f.margen),
  }))
}

/**
 * Otra oferta no vencida (fin ≥ hoy; pausadas incluidas) que comparte productos y fechas con la
 * propuesta (`findOverlap` del admin). La de menor id si hay varias.
 */
export async function buscarSolapada(
  tx: Tx,
  propuesta: { exceptoId?: number; inicio: Date; fin: Date; productoIds: number[] },
  hoy: Date,
): Promise<{ titulo: string; productoIds: number[] } | null> {
  const otra = await tx.oferta.findFirst({
    where: {
      ...(propuesta.exceptoId ? { id: { not: propuesta.exceptoId } } : {}),
      fin: { gte: hoy },
      inicio: { lte: propuesta.fin },
      AND: { fin: { gte: propuesta.inicio } },
      productos: { some: { productoId: { in: propuesta.productoIds } } },
    },
    orderBy: { id: 'asc' },
    include: { productos: { where: { productoId: { in: propuesta.productoIds } }, select: { productoId: true } } },
  })
  return otra ? { titulo: otra.titulo, productoIds: otra.productos.map((p) => p.productoId) } : null
}

/* ---------- Escritura ---------- */

export const crear = (tx: Tx, datos: DatosOferta, productoIds: number[]) =>
  tx.oferta.create({
    data: { ...datos, productos: { create: productoIds.map((productoId) => ({ productoId })) } },
    include: CON_PRODUCTOS,
  })

/**
 * Actualiza la oferta; los campos `undefined` (no enviados) no se tocan. Si llegan `productoIds`,
 * reemplaza el conjunto de productos.
 */
export function actualizar(tx: Tx, id: number, cambios: { [K in keyof DatosOferta]?: DatosOferta[K] | undefined }, productoIds?: number[]) {
  const data: Prisma.OfertaUpdateInput = Object.fromEntries(Object.entries(cambios).filter(([, valor]) => valor !== undefined))
  if (productoIds) data.productos = { deleteMany: {}, create: productoIds.map((productoId) => ({ productoId })) }
  return tx.oferta.update({ where: { id }, data, include: CON_PRODUCTOS })
}

export const fijarPausa = (id: number, pausada: boolean) =>
  prisma.oferta.update({ where: { id }, data: { pausada }, include: CON_PRODUCTOS })

/** Los productos de la oferta se borran en cascada; los productos en sí no se tocan. */
export const eliminar = (id: number) => prisma.oferta.delete({ where: { id } })

export const transaccion = <T>(trabajo: (tx: Tx) => Promise<T>) => prisma.$transaction(trabajo)
