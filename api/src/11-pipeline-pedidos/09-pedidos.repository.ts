import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'

export type Tx = Prisma.TransactionClient

const DETALLE = {
  canal: { select: { nombre: true } },
  lineas: { orderBy: { id: 'asc' } },
  cargos: { orderBy: { id: 'asc' } },
  historial: { orderBy: [{ fecha: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.PedidoInclude

export type PedidoFila = Prisma.PedidoGetPayload<{ include: typeof DETALLE }>

/** Datos que el service ya validó y calculó (snapshot y totales del servidor). */
export interface ContenidoPedido {
  clienteId: number | null
  clienteNombre: string
  clienteTelefono: string
  clienteCorreo: string
  ciudad: string
  canalId: number
  canalNombre: string
  formaPago: string
  formaEntrega: string
  notas: string
  total: string
  lineas: { productoId: number; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { concepto: string; monto: string }[]
}

export interface Evento {
  estado: EstadoPedido
  usuarioId: number
  por: string
  nota?: string
}

export const transaccion = <T>(fn: (tx: Tx) => Promise<T>) => prisma.$transaction(fn, { timeout: 15_000 })

/* ---------- Lectura ---------- */

/** Vigentes (sin los eliminados lógicamente), los más recientes primero. */
export async function listar(estado: EstadoPedido | undefined, paginacion: Paginacion): Promise<[PedidoFila[], number]> {
  const where: Prisma.PedidoWhereInput = { eliminadoEn: null, ...(estado && { estado }) }
  return prisma.$transaction([
    prisma.pedido.findMany({ where, orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }], include: DETALLE, ...rango(paginacion) }),
    prisma.pedido.count({ where }),
  ])
}

export const buscar = (id: number, cliente: Tx | typeof prisma = prisma) =>
  cliente.pedido.findFirst({ where: { id, eliminadoEn: null }, include: DETALLE })

/** Líneas actuales (para conservar el precio snapshot al editar). */
export const lineasDe = (tx: Tx, pedidoId: number) => tx.lineaPedido.findMany({ where: { pedidoId } })

/**
 * Bloquea la fila del pedido (`SELECT … FOR UPDATE`): editar, cambiar de estado y eliminar quedan
 * serializados y cada uno reevalúa su regla con el estado ya bloqueado. null si no existe o fue eliminado.
 */
export async function bloquear(tx: Tx, id: number) {
  const filas = await tx.$queryRaw<{ id: number; estado: EstadoPedido; clienteId: number | null; canalId: number; total: unknown }[]>`
    SELECT id, estado, clienteId, canalId, total FROM pedidos WHERE id = ${id} AND eliminadoEn IS NULL FOR UPDATE`
  return filas[0] ?? null
}

/* ---------- Escritura ---------- */

const datosHijos = ({ lineas, cargos }: Pick<ContenidoPedido, 'lineas' | 'cargos'>) => ({
  lineas: { create: lineas },
  cargos: { create: cargos },
})

export async function crear(tx: Tx, { lineas, cargos, ...pedido }: ContenidoPedido, evento: Evento): Promise<number> {
  const { id } = await tx.pedido.create({
    data: { ...pedido, ...datosHijos({ lineas, cargos }), historial: { create: evento } },
    select: { id: true },
  })
  return id
}

/** Reemplaza los datos editables (líneas y cargos incluidos) y deja el evento en el historial. */
export async function reemplazar(tx: Tx, id: number, { lineas, cargos, ...pedido }: ContenidoPedido, evento: Evento): Promise<void> {
  await tx.lineaPedido.deleteMany({ where: { pedidoId: id } })
  await tx.cargoPedido.deleteMany({ where: { pedidoId: id } })
  await tx.pedido.update({ where: { id }, data: { ...pedido, ...datosHijos({ lineas, cargos }), historial: { create: evento } } })
}

export const cambiarEstado = (tx: Tx, id: number, evento: Evento) =>
  tx.pedido.update({ where: { id }, data: { estado: evento.estado, historial: { create: evento } } })

export const marcarEliminado = (tx: Tx, id: number, motivo: string, evento: Evento) =>
  tx.pedido.update({
    where: { id },
    data: { eliminadoEn: new Date(), eliminadoPorId: evento.usuarioId, motivoEliminacion: motivo, historial: { create: evento } },
  })
