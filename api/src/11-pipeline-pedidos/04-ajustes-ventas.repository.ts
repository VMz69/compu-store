import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'

const CON_CONTEO = { _count: { select: { pedidos: true } } } as const

/* ---------- Canales ---------- */

/** En el orden de alta (el del selector del admin). */
export const listarCanales = () => prisma.canalVenta.findMany({ orderBy: { id: 'asc' }, include: CON_CONTEO })

export const buscarCanal = (id: number) => prisma.canalVenta.findUnique({ where: { id }, include: CON_CONTEO })

/** Nombre repetido sin distinguir acentos ni mayúsculas (intercalación `utf8mb4_unicode_ci`). */
export const canalConNombre = (nombre: string, exceptoId?: number) =>
  prisma.canalVenta.findFirst({ where: { nombre, ...(exceptoId ? { NOT: { id: exceptoId } } : {}) }, select: { id: true } })

export const crearCanal = (data: { nombre: string; insignia: string; icono: string; descripcion: string; activo: boolean }) =>
  prisma.canalVenta.create({ data, include: CON_CONTEO })

export function actualizarCanal(id: number, cambios: Record<string, unknown>) {
  const data = Object.fromEntries(Object.entries(cambios).filter(([, valor]) => valor !== undefined))
  return prisma.canalVenta.update({ where: { id }, data, include: CON_CONTEO })
}

export const eliminarCanal = (id: number) => prisma.canalVenta.delete({ where: { id } })

/* ---------- Etiquetas de estado ---------- */

export const listarEtiquetas = () => prisma.etiquetaEstadoPedido.findMany()

export const etiquetaConNombre = (nombre: string, exceptoEstado: EstadoPedido) =>
  prisma.etiquetaEstadoPedido.findFirst({ where: { nombre, NOT: { estado: exceptoEstado } }, select: { estado: true } })

export const guardarEtiqueta = (estado: EstadoPedido, nombre: string, descripcion: string) =>
  prisma.etiquetaEstadoPedido.update({ where: { estado }, data: { nombre, descripcion } })
