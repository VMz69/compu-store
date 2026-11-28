import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'

/**
 * Métricas de pedidos para reportes (L18), calculadas en la BD sobre los pedidos vigentes (sin los
 * eliminados lógicamente). Venta efectiva = facturado + entregado (`SOLD_STATUSES` del admin).
 */
export const ESTADOS_VENDIDOS: EstadoPedido[] = ['facturado', 'entregado']

export interface FilaEstado {
  estado: EstadoPedido
  pedidos: number
  /** Suma de `total` en DECIMAL. */
  importe: Prisma.Decimal
}

/** Conteo e importe por estado (los estados sin pedidos no aparecen). */
export async function totalesPorEstado(): Promise<FilaEstado[]> {
  const filas = await prisma.pedido.groupBy({
    by: ['estado'],
    where: { eliminadoEn: null },
    _count: { _all: true },
    _sum: { total: true },
  })
  return filas.map((f) => ({ estado: f.estado, pedidos: f._count._all, importe: f._sum.total ?? new Prisma.Decimal(0) }))
}

export interface FilaCliente {
  clienteId: number
  pedidos: number
  totalComprado: Prisma.Decimal
  ultimoPedido: Date | null
}

/**
 * Historial de compra de cada cliente del directorio (regla del admin, `getCustomerOrderStats`):
 * un pedido es del cliente por `clienteId`; si no tiene, por el teléfono normalizado (solo dígitos).
 * Paginado por id de cliente.
 */
export async function estadisticasPorCliente(paginacion: Paginacion): Promise<[FilaCliente[], number]> {
  const { skip, take } = rango(paginacion)
  const vendidos = Prisma.join(ESTADOS_VENDIDOS)
  const [filas, total] = await Promise.all([
    prisma.$queryRaw<{ clienteId: number; pedidos: bigint; totalComprado: Prisma.Decimal | null; ultimoPedido: Date | null }[]>`
      SELECT c.id AS clienteId,
             COUNT(p.id) AS pedidos,
             SUM(CASE WHEN p.estado IN (${vendidos}) THEN p.total END) AS totalComprado,
             MAX(p.creadoEn) AS ultimoPedido
      FROM clientes c
      LEFT JOIN pedidos p
        ON p.eliminadoEn IS NULL
       AND (p.clienteId = c.id
            OR (p.clienteId IS NULL AND REGEXP_REPLACE(p.clienteTelefono, '[^0-9]', '') = c.telefonoNormalizado))
      WHERE c.eliminadoEn IS NULL
      GROUP BY c.id
      ORDER BY c.id
      LIMIT ${take} OFFSET ${skip}`,
    prisma.cliente.count({ where: { eliminadoEn: null } }),
  ])
  return [
    filas.map((f) => ({
      clienteId: f.clienteId,
      pedidos: Number(f.pedidos),
      totalComprado: new Prisma.Decimal(f.totalComprado ?? 0),
      ultimoPedido: f.ultimoPedido,
    })),
    total,
  ]
}
