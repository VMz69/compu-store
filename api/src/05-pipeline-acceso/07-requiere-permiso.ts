import type { RequestHandler } from 'express'
import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { clavesDeUsuario, type Usuario } from './04-acceso.repository.js'
import { ACCESO_TOTAL, normalizarAccesos, SUPERADMIN, type Accesos, type Permiso } from './06-permisos.catalogo.js'
import { usuarioDe } from './05-autorizacion.js'

/**
 * Accesos que rigen para el usuario, leídos de la BD en cada llamada (sin caché).
 * Superadmin: acceso total, siempre. Una acción sin su vista no cuenta.
 */
export async function accesosEfectivos(usuario: Pick<Usuario, 'id' | 'rol'>): Promise<Accesos> {
  if (usuario.rol === SUPERADMIN) return ACCESO_TOTAL
  return normalizarAccesos(await clavesDeUsuario(usuario.id))
}

export const tienePermiso = (accesos: Accesos, permiso: Permiso): boolean =>
  (accesos.vistas as string[]).includes(permiso) || (accesos.acciones as string[]).includes(permiso)

/** Marca que la prueba de cobertura busca en cada ruta /admin. */
export const MARCA_PERMISO = Symbol('requierePermiso')

/**
 * Autorización por vista o acción (L09). Pasa si el usuario tiene **alguna** de las alternativas;
 * si no, 403 PERMISSION_DENIED (no cierra la sesión en el admin). Va después de `autenticar`.
 */
export function requierePermiso(...alternativas: [Permiso, ...Permiso[]]): RequestHandler {
  const middleware: RequestHandler = async (_req, res, next) => {
    const accesos = await accesosEfectivos(usuarioDe(res))
    if (!alternativas.some((p) => tienePermiso(accesos, p))) {
      throw new ErrorApp('PERMISSION_DENIED', 403, 'No tienes permiso para realizar esta acción.')
    }
    next()
  }
  return Object.assign(middleware, { [MARCA_PERMISO]: alternativas })
}
