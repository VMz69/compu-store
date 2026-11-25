import type { RequestHandler, Response } from 'express'
import { ErrorApp, identidadDe } from '../04-pipeline-http/00-director-http.js'
import { buscarPorFirebaseUid, type Usuario } from './04-acceso.repository.js'

/**
 * Autorización de la Fase A: la identidad debe estar vinculada a un Usuario activo.
 * Si no lo está → 403 FORBIDDEN. El RBAC por permiso (`requierePermiso`) llega en L09.
 */
export const usuarioHabilitado: RequestHandler = async (_req, res, next) => {
  const usuario = await buscarPorFirebaseUid(identidadDe(res).uid)
  if (!usuario) throw new ErrorApp('FORBIDDEN', 403, 'Tu cuenta no está habilitada en el panel. Contacta al administrador.')
  if (!usuario.activo) throw new ErrorApp('FORBIDDEN', 403, 'Tu cuenta está desactivada. Contacta al administrador.')
  res.locals.usuario = usuario
  next()
}

/** Usuario que dejó `usuarioHabilitado`; lanza 403 si la ruta no pasó por el middleware. */
export function usuarioDe(res: Response): Usuario {
  const usuario = res.locals.usuario as Usuario | undefined
  if (!usuario) throw new ErrorApp('FORBIDDEN', 403, 'Usuario no habilitado.')
  return usuario
}
