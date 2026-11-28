import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'

export type Tx = Prisma.TransactionClient

const DETALLE = {
  canal: { select: { nombre: true } },
  lineas: { orderBy: { id: 'asc' } },
  cargos: { orderBy: { id: 'asc' } },
  historial: { orderBy: [{ fecha: 'asc' }, { id: 'asc' }] },
  // L15: la factura activa (emitida) por la relación; pedidos no importa el pipeline de facturación.
  facturas: { where: { pedidoActivoId: { not: null } }, select: { id: true, numeroControl: true, correlativo: true } },
  // L16: la cotización de origen por la relación; pedidos no importa el pipeline de cotizaciones.
  cotizacion: { select: { id: true, codigo: true } },
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
  /** Cotización de origen (solo al convertir, L16); editar no la cambia. */
  cotizacionId?: number
}

export interface Evento {
  estado: EstadoPedido
  /** null = el sistema (vencimiento de reservas) o el seed. */
  usuarioId: number | null
  por: string
  nota?: string
}

/**
 * READ COMMITTED (L14): las reglas se deciden sobre filas bloqueadas (`FOR UPDATE`), y cada sentencia ve lo
 * último confirmado. Con REPEATABLE READ, MariaDB 11.8 (`innodb_snapshot_isolation`) rechaza con 1020 el
 * bloqueo de una fila que otra transacción cambió después de abrirse la vista de lectura: la segunda de dos
 * reservas sobre la última unidad fallaba con 500 en vez de 422. Además evita los bloqueos de hueco.
 */
export const transaccion = <T>(fn: (tx: Tx) => Promise<T>) =>
  prisma.$transaction(fn, { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })

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
export async function bloquear(tx: Tx, id: number): Promise<PedidoBloqueado | null> {
  const filas = await tx.$queryRaw<PedidoBloqueado[]>`
    SELECT id, estado, DATE_FORMAT(reservadoHasta, '%Y-%m-%d') AS reservadoHasta
    FROM pedidos WHERE id = ${id} AND eliminadoEn IS NULL FOR UPDATE`
  return filas[0] ? { ...filas[0], id: Number(filas[0].id) } : null
}

export interface PedidoBloqueado {
  id: number
  estado: EstadoPedido
  /** `YYYY-MM-DD` o null. */
  reservadoHasta: string | null
}

/**
 * Reservas caducadas (`reservadoHasta` < hoy), opcionalmente solo las que tocan esos productos, ya bloqueadas.
 * Dos pasos para no bloquear rangos del índice `estado` (con REPEATABLE READ un `FOR UPDATE` que recorre
 * el índice deja next-key locks que interbloquean con el cambio de estado de otra reserva):
 *  1. candidatos con una lectura sin bloqueo;
 *  2. cada uno se bloquea por su clave primaria con `SKIP LOCKED`, que relee la versión confirmada más
 *     reciente y vuelve a comprobar la condición. Nunca se espera a un pedido que otra transacción ya
 *     tiene, así que no hay interbloqueos y dos barridos simultáneos no vencen el mismo pedido.
 */
export async function vencidas(tx: Tx, hoy: string, productoIds?: number[]): Promise<PedidoBloqueado[]> {
  if (productoIds?.length === 0) return []
  const deProductos = productoIds
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM pedidos_lineas l WHERE l.pedidoId = p.id AND l.productoId IN (${Prisma.join(productoIds)}))`
    : Prisma.empty
  const candidatos = await tx.$queryRaw<{ id: number }[]>`
    SELECT p.id FROM pedidos p
    WHERE p.estado = 'confirmado' AND p.eliminadoEn IS NULL AND p.reservadoHasta < ${hoy} ${deProductos}
    ORDER BY p.id`
  const bloqueados: PedidoBloqueado[] = []
  for (const { id } of candidatos) {
    const [fila] = await tx.$queryRaw<PedidoBloqueado[]>`
      SELECT id, estado, DATE_FORMAT(reservadoHasta, '%Y-%m-%d') AS reservadoHasta FROM pedidos
      WHERE id = ${id} AND estado = 'confirmado' AND eliminadoEn IS NULL AND reservadoHasta < ${hoy}
      FOR UPDATE SKIP LOCKED`
    if (fila) bloqueados.push({ ...fila, id: Number(fila.id) })
  }
  return bloqueados
}

/** Pedidos reservados que apartan unidades del producto (para el mensaje de inventario). */
export const reservantes = (tx: Tx, productoId: number) =>
  tx.lineaPedido.findMany({
    where: { productoId, pedido: { estado: 'confirmado', eliminadoEn: null } },
    orderBy: { pedidoId: 'asc' },
    select: { cantidad: true, pedido: { select: { id: true, creadoEn: true } } },
  })

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

/** Cancelar o entregar: ninguno de los dos conserva una reserva. */
export const cambiarEstado = (tx: Tx, id: number, evento: Evento) =>
  tx.pedido.update({ where: { id }, data: { estado: evento.estado, reservadoHasta: null, historial: { create: evento } } })

/** Reservar (`hasta`) o volver a Registrado al vencer (`null`), con su evento. */
export const fijarReserva = (tx: Tx, id: number, hasta: Date | null, evento: Evento) =>
  tx.pedido.update({ where: { id }, data: { estado: evento.estado, reservadoHasta: hasta, historial: { create: evento } } })

export const marcarEliminado = (tx: Tx, id: number, motivo: string, evento: Evento) =>
  tx.pedido.update({
    where: { id },
    data: { eliminadoEn: new Date(), eliminadoPorId: evento.usuarioId, reservadoHasta: null, motivoEliminacion: motivo, historial: { create: evento } },
  })
