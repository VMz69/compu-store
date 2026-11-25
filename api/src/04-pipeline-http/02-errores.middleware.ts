import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../../generated/prisma/client.js'

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

/** Cuerpo mayor que el límite del parser (express.json / express.raw). */
const esCuerpoGrande = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { type?: unknown }).type === 'entity.too.large'

/**
 * Respaldo para errores de Prisma que un service no tradujo: unicidad (P2002) y
 * referencias (P2003) → 409; registro inexistente (P2025) → 404.
 */
function errorPrisma(error: unknown): ErrorApp | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null
  if (error.code === 'P2002') return new ErrorApp('CONFLICT', 409, 'Ya existe un registro con ese valor único.')
  if (error.code === 'P2003') return new ErrorApp('CONFLICT', 409, 'El registro está referenciado por otros datos.')
  if (error.code === 'P2025') return new ErrorApp('NOT_FOUND', 404, 'El recurso no existe.')
  return null
}

/**
 * Último middleware: traduce cualquier error a `{ error: { code, message, details? } }`.
 * Los errores no previstos se registran sin datos de la petición y responden 500 genérico.
 */
export const manejarErrores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let respuesta: ErrorApp
  const prisma = errorPrisma(error)
  if (error instanceof ErrorApp) respuesta = error
  else if (prisma) respuesta = prisma
  else if (error instanceof ZodError) respuesta = new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', detallesZod(error))
  else if (esJsonInvalido(error)) respuesta = new ErrorApp('VALIDATION_ERROR', 400, 'El cuerpo no es un JSON válido.')
  else if (esCuerpoGrande(error)) respuesta = new ErrorApp('VALIDATION_ERROR', 400, 'El cuerpo de la petición supera el tamaño permitido.')
  else {
    console.error('[error interno]', error instanceof Error ? error.message : error)
    respuesta = new ErrorApp('INTERNAL_ERROR', 500, 'Error interno del servidor.')
  }

  const { code, message, details } = respuesta
  res.status(respuesta.status).json({ error: details === undefined ? { code, message } : { code, message, details } })
}
