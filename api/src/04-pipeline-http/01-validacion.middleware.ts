import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ErrorApp, detallesZod } from './02-errores.middleware.js'

interface EsquemasPeticion {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

/**
 * Valida body, query y params con Zod y reemplaza cada uno por su versión
 * parseada (con coerciones y valores por defecto). Si falla → 400 VALIDATION_ERROR.
 */
export const validar =
  (esquemas: EsquemasPeticion): RequestHandler =>
  (req, _res, next) => {
    for (const parte of ['params', 'query', 'body'] as const) {
      const esquema = esquemas[parte]
      if (!esquema) continue
      const resultado = esquema.safeParse(req[parte])
      if (!resultado.success) {
        next(new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', detallesZod(resultado.error)))
        return
      }
      // En Express 5 `req.query` es un getter: se redefine en lugar de asignarlo.
      Object.defineProperty(req, parte, { value: resultado.data, writable: true, enumerable: true, configurable: true })
    }
    next()
  }
