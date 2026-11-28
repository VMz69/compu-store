import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'
import { esquemaCargo, esquemaClienteOcasional, esquemaLinea } from '../11-pipeline-pedidos/00-director-pedidos.js'

/**
 * Cotización (L16): mismas líneas, cargos y cliente ocasional que el pedido (`useLineItems`,
 * `useExtraCharges` y `useCustomerSelection` son compartidos en el admin). Cuerpos estrictos: precios,
 * importes, totales, emisor, número y autor los pone el servidor (400 si llegan del navegador).
 */

/** = `VALIDITY_OPTIONS` del admin. */
export const VALIDECES = [7, 15, 30] as const

/** Estados que se pueden fijar a mano desde «emitida» (el resto se deriva). */
export const DESTINOS_COTIZACION = ['aceptada', 'rechazada'] as const

const clienteOcasional = esquemaClienteOcasional.extend({
  documento: z.string().trim().max(17, 'Máximo 17 caracteres.').default(''),
})

export const esquemaCotizacion = z
  .strictObject({
    clienteId: z.number().int().positive().nullable().default(null),
    cliente: clienteOcasional.optional(),
    notas: z.string().trim().max(2000, 'Máximo 2000 caracteres.').default(''),
    validezDias: z
      .number()
      .int()
      .refine((d) => (VALIDECES as readonly number[]).includes(d), 'Validez: 7, 15 o 30 días.')
      .default(15),
    lineas: z.array(esquemaLinea).min(1, 'Agrega al menos un producto.').max(50, 'Máximo 50 productos.'),
    cargos: z.array(esquemaCargo).max(6, 'Máximo 6 cargos extra por documento.').default([]),
  })
  .superRefine((c, ctx) => {
    if (c.clienteId === null && !c.cliente) ctx.addIssue({ code: 'custom', path: ['cliente'], message: 'Indica el cliente.' })
    if (c.clienteId !== null && c.cliente) {
      ctx.addIssue({ code: 'custom', path: ['cliente'], message: 'Envía el cliente del directorio o uno ocasional, no ambos.' })
    }
    const ids = c.lineas.map((l) => l.productoId)
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['lineas'], message: 'Un producto aparece repetido.' })
  })

export const esquemaIdCotizacion = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaEstadoCotizacion = z.strictObject({ estado: z.enum(DESTINOS_COTIZACION) })

export const esquemaListarCotizaciones = esquemaPaginacion

export type DatosCotizacion = z.infer<typeof esquemaCotizacion>
export type DestinoCotizacion = (typeof DESTINOS_COTIZACION)[number]
