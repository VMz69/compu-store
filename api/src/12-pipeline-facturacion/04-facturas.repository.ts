import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoFactura } from './02-facturas.schema.js'

export type Tx = Prisma.TransactionClient

const DETALLE = {
  lineas: { orderBy: { id: 'asc' } },
  pedido: { select: { id: true, creadoEn: true } },
} satisfies Prisma.FacturaInclude

export type FacturaFila = Prisma.FacturaGetPayload<{ include: typeof DETALLE }>

/** READ COMMITTED, como pedidos e inventario (L14): las reglas se deciden sobre filas bloqueadas. */
export const transaccion = <T>(fn: (tx: Tx) => Promise<T>) =>
  prisma.$transaction(fn, { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })

/* ---------- Lectura ---------- */

/** Las más recientes primero. */
export async function listar(estado: EstadoFactura | undefined, paginacion: Paginacion): Promise<[FacturaFila[], number]> {
  const where: Prisma.FacturaWhereInput = estado ? { estado } : {}
  return prisma.$transaction([
    prisma.factura.findMany({ where, orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }], include: DETALLE, ...rango(paginacion) }),
    prisma.factura.count({ where }),
  ])
}

export const buscar = (id: number, cliente: Tx | typeof prisma = prisma) => cliente.factura.findUnique({ where: { id }, include: DETALLE })

export interface FacturaBloqueada {
  id: number
  pedidoId: number
  estado: EstadoFactura
  correlativo: number
}

/** Bloquea la factura (`SELECT … FOR UPDATE`): dos anulaciones simultáneas quedan serializadas. */
export async function bloquear(tx: Tx, id: number): Promise<FacturaBloqueada | null> {
  const [fila] = await tx.$queryRaw<FacturaBloqueada[]>`
    SELECT id, pedidoId, estado, correlativo FROM facturas WHERE id = ${id} FOR UPDATE`
  return fila ? { id: Number(fila.id), pedidoId: Number(fila.pedidoId), estado: fila.estado, correlativo: Number(fila.correlativo) } : null
}

/* ---------- Escritura ---------- */

/** Línea lista para guardar (sin `facturaId`). */
export type LineaNueva = Omit<Prisma.LineaFacturaCreateManyInput, 'facturaId'>

/**
 * Crea la factura y luego sus líneas con `createMany`, que conserva el orden del documento (productos y luego
 * cargos). Un `create` anidado con líneas mixtas (con y sin producto) las insertaba en otro orden.
 */
export async function crear(tx: Tx, datos: Omit<Prisma.FacturaUncheckedCreateInput, 'lineas'>, lineas: LineaNueva[]): Promise<number> {
  const { id } = await tx.factura.create({ data: datos, select: { id: true } })
  await tx.lineaFactura.createMany({ data: lineas.map((l) => ({ ...l, facturaId: id })) })
  return id
}

/** Anulada: deja de ser la factura activa del pedido (`pedidoActivoId` null) y conserva su número. */
export const anular = (tx: Tx, id: number, operador: { id: number; nombre: string }) =>
  tx.factura.update({
    where: { id },
    data: { estado: 'anulada', pedidoActivoId: null, anuladaEn: new Date(), anuladaPorId: operador.id, anuladaPor: operador.nombre },
    select: { id: true },
  })
