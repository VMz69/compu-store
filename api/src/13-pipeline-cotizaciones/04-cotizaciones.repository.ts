import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { DestinoCotizacion } from './02-cotizaciones.schema.js'

export type Tx = Prisma.TransactionClient

const DETALLE = {
  lineas: { orderBy: { id: 'asc' } },
  cargos: { orderBy: { id: 'asc' } },
  // Pedido activo (no cancelado ni eliminado) por la relación: cotizaciones no lee archivos internos de pedidos.
  pedidos: {
    where: { eliminadoEn: null, estado: { not: 'cancelado' } },
    orderBy: { id: 'desc' },
    take: 1,
    select: { id: true, creadoEn: true },
  },
} satisfies Prisma.CotizacionInclude

export type CotizacionFila = Prisma.CotizacionGetPayload<{ include: typeof DETALLE }>

/** Datos que el service ya validó y calculó (snapshots, número y total del servidor). */
export interface CotizacionNueva {
  numero: number
  codigo: string
  clienteId: number | null
  clienteNombre: string
  clienteTelefono: string
  clienteCorreo: string
  clienteDocumento: string
  notas: string
  validezDias: number
  validaHasta: Date
  emisor: Prisma.InputJsonValue
  total: string
  creadaEn?: Date
  creadaPorId: number | null
  creadaPor: string
  estado?: 'emitida' | DestinoCotizacion
  lineas: { productoId: number; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { concepto: string; monto: string }[]
}

/** READ COMMITTED, como pedidos (L14): las reglas se deciden sobre la fila bloqueada. */
export const transaccion = <T>(fn: (tx: Tx) => Promise<T>) =>
  prisma.$transaction(fn, { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })

/* ---------- Lectura ---------- */

/** Las más recientes primero (= la lista del admin). */
export async function listar(paginacion: Paginacion): Promise<[CotizacionFila[], number]> {
  return prisma.$transaction([
    prisma.cotizacion.findMany({ orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }], include: DETALLE, ...rango(paginacion) }),
    prisma.cotizacion.count(),
  ])
}

export const buscar = (id: number, cliente: Tx | typeof prisma = prisma) => cliente.cotizacion.findUnique({ where: { id }, include: DETALLE })

/** Bloquea la fila (`SELECT … FOR UPDATE`): convertir, cambiar de estado y eliminar quedan serializados. */
export async function bloquear(tx: Tx, id: number): Promise<CotizacionFila | null> {
  const filas = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM cotizaciones WHERE id = ${id} FOR UPDATE`
  return filas[0] ? buscar(id, tx) : null
}

/** Pedido más reciente que originó (también cancelado o eliminado): con alguno, la cotización no se elimina. */
export const ultimoPedido = (tx: Tx, cotizacionId: number) =>
  tx.pedido.findFirst({ where: { cotizacionId }, orderBy: { id: 'desc' }, select: { id: true, creadoEn: true } })

/* ---------- Escritura ---------- */

export async function crear(cliente: Tx, { lineas, cargos, ...cotizacion }: CotizacionNueva): Promise<number> {
  const { id } = await cliente.cotizacion.create({
    data: { ...cotizacion, lineas: { create: lineas }, cargos: { create: cargos } },
    select: { id: true },
  })
  return id
}

export const fijarEstado = (tx: Tx, id: number, estado: DestinoCotizacion) => tx.cotizacion.update({ where: { id }, data: { estado } })

export const eliminar = (tx: Tx, id: number) => tx.cotizacion.delete({ where: { id } })
