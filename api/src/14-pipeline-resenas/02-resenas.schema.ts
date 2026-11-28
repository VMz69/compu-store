import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'

/**
 * Reseñas (L17). El formulario público envía solo lo que captura «Escribe tu opinión»: estado,
 * verificación, producto y fechas los pone el servidor (cuerpo estricto: 400 si llegan del navegador).
 */

/** = `MIN_COMMENT` del store. */
export const MINIMO_COMENTARIO = 10

export const ESTADOS_RESENA = ['pendiente', 'aprobada', 'rechazada'] as const

export const esquemaEnviarResena = z.strictObject({
  calificacion: z.number().int().min(1, 'Califica de 1 a 5 estrellas.').max(5, 'Califica de 1 a 5 estrellas.'),
  autor: z.string().trim().min(1, 'Ingresa tu nombre.').max(60, 'Máximo 60 caracteres.'),
  ciudad: z.string().trim().max(60, 'Máximo 60 caracteres.').default(''),
  comentario: z
    .string()
    .trim()
    .min(MINIMO_COMENTARIO, `Cuéntanos un poco más (mínimo ${MINIMO_COMENTARIO} caracteres).`)
    .max(1000, 'Máximo 1000 caracteres.'),
})

export const esquemaIdProductoResenas = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaIdResena = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaListarResenas = esquemaPaginacion.extend({ estado: z.enum(ESTADOS_RESENA).optional() })

/** Aprobar (publicar) o rechazar (ocultar) con motivo interno; nunca se vuelve a «pendiente». */
export const esquemaModerarResena = z.discriminatedUnion('estado', [
  z.strictObject({ estado: z.literal('aprobada') }),
  z.strictObject({ estado: z.literal('rechazada'), motivo: z.string().trim().min(3, 'Indica el motivo (mínimo 3 caracteres).').max(200, 'Máximo 200 caracteres.') }),
])

/** «Aprobar N visibles» del admin. */
export const esquemaAprobarResenas = z.strictObject({
  ids: z
    .array(z.number().int().positive())
    .min(1, 'Indica al menos una reseña.')
    .max(100, 'Máximo 100 reseñas por operación.')
    .refine((ids) => new Set(ids).size === ids.length, 'Una reseña aparece repetida.'),
})

export type EnviarResena = z.infer<typeof esquemaEnviarResena>
export type ListarResenas = z.infer<typeof esquemaListarResenas>
export type ModerarResena = z.infer<typeof esquemaModerarResena>
export type EstadoResena = (typeof ESTADOS_RESENA)[number]
