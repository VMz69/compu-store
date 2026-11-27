import { z } from 'zod'

/**
 * Ajustes › Canales y flujo (L13): reglas de `validateChannel` y `validateStatusLabel` del admin
 * (`admin/src/42-…/02-order.service.ts`, `admin/src/39-…/02-orderFlow.ts`).
 */
export const ESTADOS_PEDIDO = ['registrado', 'confirmado', 'facturado', 'entregado', 'cancelado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

const nombreCanal = z.string().trim().min(3, 'Usa entre 3 y 40 caracteres.').max(40, 'Usa entre 3 y 40 caracteres.')
const insignia = z.string().trim().min(1, 'Indica la insignia.').max(30, 'Máximo 30 caracteres.')
const icono = z.string().trim().min(1, 'Elige un ícono.').max(60, 'Máximo 60 caracteres.')
const descripcion = z.string().trim().max(160, 'Máximo 160 caracteres.')

export const esquemaCrearCanal = z.strictObject({
  nombre: nombreCanal,
  insignia: insignia.default('Canal'),
  icono,
  descripcion: descripcion.default(''),
  activo: z.boolean().default(true),
})

export const esquemaEditarCanal = z.strictObject({
  nombre: nombreCanal.optional(),
  insignia: insignia.optional(),
  icono: icono.optional(),
  descripcion: descripcion.optional(),
  activo: z.boolean().optional(),
})

export const esquemaIdCanal = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaEstado = z.object({ estado: z.enum(ESTADOS_PEDIDO) })

export const esquemaEtiquetaEstado = z.strictObject({
  nombre: z.string().trim().min(3, 'Usa entre 3 y 30 caracteres.').max(30, 'Usa entre 3 y 30 caracteres.'),
  descripcion: z.string().trim().max(200, 'Máximo 200 caracteres.').default(''),
})

export type CrearCanal = z.infer<typeof esquemaCrearCanal>
export type EditarCanal = z.infer<typeof esquemaEditarCanal>
export type EtiquetaEstado = z.infer<typeof esquemaEtiquetaEstado>
