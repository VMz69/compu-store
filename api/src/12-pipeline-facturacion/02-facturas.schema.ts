import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'

/**
 * Factura (L15). El navegador solo elige el pedido, el receptor, la condición de pago y las notas; líneas,
 * importes, totales, emisor, números y autor los pone el servidor. Cuerpo estricto: cualquier importe → 400.
 */

export const ESTADOS_FACTURA = ['emitida', 'anulada'] as const
export const CONDICIONES_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'credito'] as const

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Máximo 254 caracteres.')
  .refine((c) => c === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c), 'Correo no válido.')
  .default('')

/** Receptor identificado o «Consumidor Final» (= `ReceptorFields` del admin). */
const receptor = z
  .strictObject({
    consumidorFinal: z.boolean(),
    nombre: z.string().trim().max(100, 'Máximo 100 caracteres.').default(''),
    documento: z.string().trim().max(17, 'Máximo 17 caracteres.').default(''),
    direccion: z.string().trim().max(255, 'Máximo 255 caracteres.').default(''),
    correo,
  })
  .superRefine((r, ctx) => {
    if (!r.consumidorFinal && r.nombre.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'Ingresa el nombre del receptor.' })
    }
  })

export const esquemaEmision = z.strictObject({
  pedidoId: z.number().int().positive('Pedido no válido.'),
  receptor,
  condicionPago: z.enum(CONDICIONES_PAGO, 'Condición de pago no válida.'),
  notas: z.string().trim().max(500, 'Máximo 500 caracteres.').default(''),
})

export const esquemaIdFactura = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaListarFacturas = esquemaPaginacion.extend({ estado: z.enum(ESTADOS_FACTURA).optional() })

export type DatosEmision = z.infer<typeof esquemaEmision>
export type ListarFacturas = z.infer<typeof esquemaListarFacturas>
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number]
