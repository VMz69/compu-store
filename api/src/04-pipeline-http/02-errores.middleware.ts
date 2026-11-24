import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

/** Códigos de error estables del contrato (docs/fase-1/contratos-A.md §1). */
export type CodigoError =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

/** Error de negocio o de protocolo con estado HTTP y código estable. */
export class ErrorApp extends Error {
  readonly code: CodigoError
  readonly status: number
  readonly details: unknown

  constructor(code: CodigoError, status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ErrorApp'
    this.code = code
    this.status = status
    this.details = details
  }
}

/** Detalle legible de un error de Zod: ruta del campo y mensaje. */
export const detallesZod = (error: ZodError) =>
  error.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }))

/** Ruta no registrada → 404 con el sobre de error. */
export const noEncontrado: RequestHandler = (req, _res, next) => {
  next(new ErrorApp('NOT_FOUND', 404, `No existe el recurso ${req.method} ${req.path}.`))
}

const esJsonInvalido = (error: unknown): boolean =>
  error instanceof SyntaxError && (error as SyntaxError & { type?: string }).type === 'entity.parse.failed'

/**
 * Último middleware: traduce cualquier error a `{ error: { code, message, details? } }`.
 * Los errores no previstos se registran sin datos de la petición y responden 500 genérico.
 */
export const manejarErrores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let respuesta: ErrorApp
  if (error instanceof ErrorApp) respuesta = error
  else if (error instanceof ZodError) respuesta = new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', detallesZod(error))
  else if (esJsonInvalido(error)) respuesta = new ErrorApp('VALIDATION_ERROR', 400, 'El cuerpo no es un JSON válido.')
  else {
    console.error('[error interno]', error instanceof Error ? error.message : error)
    respuesta = new ErrorApp('INTERNAL_ERROR', 500, 'Error interno del servidor.')
  }

  const { code, message, details } = respuesta
  res.status(respuesta.status).json({ error: details === undefined ? { code, message } : { code, message, details } })
}
