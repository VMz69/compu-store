import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

/** Cliente de Prisma dentro o fuera de una transacción (el seed emite facturas dentro de la suya, L15). */
export type Cliente = Prisma.TransactionClient | typeof prisma

/** Fila única de la configuración pública de la tienda (id = 1, sembrada en L02). */
export const configuracion = (cliente: Cliente = prisma) => cliente.configuracionTienda.findUnique({ where: { id: 1 } })

export type Configuracion = NonNullable<Awaited<ReturnType<typeof configuracion>>>

/** Actualiza la fila id = 1 (L10). Si no existe, Prisma lanza P2025 → 404. */
export const actualizarConfiguracion = (datos: Prisma.ConfiguracionTiendaUpdateInput) =>
  prisma.configuracionTienda.update({ where: { id: 1 }, data: datos })

/**
 * Último correlativo interno de factura (L15). La tabla es de facturación, pero se lee aquí directamente
 * (como ofertas lee `productos`) porque facturación ya depende de tienda: importar su director sería un ciclo.
 */
export const ultimoCorrelativoFactura = async (): Promise<number> =>
  (await prisma.correlativo.findUnique({ where: { clave: 'factura-interno' }, select: { ultimo: true } }))?.ultimo ?? 0
