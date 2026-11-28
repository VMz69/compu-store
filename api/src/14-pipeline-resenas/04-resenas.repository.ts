import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoResena } from './02-resenas.schema.js'

export type ResenaFila = Prisma.ResenaGetPayload<object>

/** Las más recientes primero (= «Más recientes primero» del store). */
const RECIENTES = [{ creadoEn: 'desc' }, { id: 'desc' }] satisfies Prisma.ResenaOrderByWithRelationInput[]

/* ---------- Lectura ---------- */

export async function aprobadasDe(productoId: number, paginacion: Paginacion): Promise<[ResenaFila[], number]> {
  const where = { productoId, estado: 'aprobada' } satisfies Prisma.ResenaWhereInput
  return prisma.$transaction([prisma.resena.findMany({ where, orderBy: RECIENTES, ...rango(paginacion) }), prisma.resena.count({ where })])
}

export async function listar(estado: EstadoResena | undefined, paginacion: Paginacion): Promise<[ResenaFila[], number]> {
  const where = estado ? { estado } : {}
  return prisma.$transaction([prisma.resena.findMany({ where, orderBy: RECIENTES, ...rango(paginacion) }), prisma.resena.count({ where })])
}

export const buscar = (id: number) => prisma.resena.findUnique({ where: { id } })

export const buscarVarias = (ids: number[]) => prisma.resena.findMany({ where: { id: { in: ids } }, orderBy: RECIENTES })

/** Misma opinión (producto, autor y comentario) enviada desde `desde`, en cualquier estado. */
export const duplicada = (productoId: number, autor: string, comentario: string, desde: Date) =>
  prisma.resena.findFirst({ where: { productoId, autor, comentario, creadoEn: { gte: desde } }, select: { id: true } })

/* ---------- Escritura ---------- */

export const crear = (datos: Prisma.ResenaUncheckedCreateInput) => prisma.resena.create({ data: datos })

interface Moderacion {
  moderadoPorId: number
  moderadoPor: string
  motivoRechazo: string
}

/**
 * Cambia el estado solo si es distinto del actual (una sola sentencia: dos moderadores a la vez no
 * pisan la regla). Devuelve cuántas filas cambiaron.
 */
export async function moderar(ids: number[], estado: Exclude<EstadoResena, 'pendiente'>, moderacion: Moderacion): Promise<number> {
  const { count } = await prisma.resena.updateMany({
    where: { id: { in: ids }, estado: { not: estado } },
    data: { estado, ...moderacion, moderadoEn: new Date() },
  })
  return count
}

export async function eliminar(id: number): Promise<number> {
  const { count } = await prisma.resena.deleteMany({ where: { id } })
  return count
}
