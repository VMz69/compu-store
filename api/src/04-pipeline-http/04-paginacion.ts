import { z } from 'zod'

/** Query de paginación (D-06): `page` ≥ 1 y `limit` de 1 a 100 (por defecto 100, lo que piden los adaptadores de A). */
export const esquemaPaginacion = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
})

export type Paginacion = z.infer<typeof esquemaPaginacion>

export interface MetaPaginacion {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** `skip`/`take` de Prisma para la página pedida. */
export const rango = ({ page, limit }: Paginacion) => ({ skip: (page - 1) * limit, take: limit })

export const meta = ({ page, limit }: Paginacion, total: number): MetaPaginacion => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})
