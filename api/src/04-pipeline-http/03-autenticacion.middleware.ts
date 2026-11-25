import type { RequestHandler, Response } from 'express'
import type { Identidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp } from './02-errores.middleware.js'

const FORMATO_BEARER = /^Bearer ([^\s]+)$/

/**
 * Exige `Authorization: Bearer <ID token>` y guarda la identidad verificada en
 * `res.locals.identidad`. Sin token o con uno inválido → 401 UNAUTHENTICATED.
 * El token nunca se registra.
 */
export const autenticacion =
  (verificarToken: (token: string) => Promise<Identidad>): RequestHandler =>
  async (req, res, next) => {
    const token = FORMATO_BEARER.exec(req.get('authorization') ?? '')?.[1]
    if (!token) {
      next(new ErrorApp('UNAUTHENTICATED', 401, 'Se requiere iniciar sesión.'))
      return
    }
    try {
      res.locals.identidad = await verificarToken(token)
    } catch {
      next(new ErrorApp('UNAUTHENTICATED', 401, 'La sesión no es válida o expiró.'))
      return
    }
    next()
  }

/** Identidad que dejó `autenticacion`; lanza 401 si la ruta no pasó por el middleware. */
export function identidadDe(res: Response): Identidad {
  const identidad = res.locals.identidad as Identidad | undefined
  if (!identidad) throw new ErrorApp('UNAUTHENTICATED', 401, 'Se requiere iniciar sesión.')
  return identidad
}
