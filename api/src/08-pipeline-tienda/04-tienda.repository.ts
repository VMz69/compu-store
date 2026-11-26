import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

/** Fila única de la configuración pública de la tienda (id = 1, sembrada en L02). */
export const configuracion = () => prisma.configuracionTienda.findUnique({ where: { id: 1 } })

export type Configuracion = NonNullable<Awaited<ReturnType<typeof configuracion>>>
