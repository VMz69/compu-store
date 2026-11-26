// API pública del pipeline de acceso.
import type { RequestHandler } from 'express'
import type { ProveedorIdentidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { autenticacion } from '../04-pipeline-http/00-director-http.js'
import { usuarioHabilitado } from './05-autorizacion.js'

export { crearRouterSesion } from './01-acceso.routes.js'
export { esquemaContrasena, ROLES, type Rol } from './02-acceso.schema.js'
export { vincular, type DatosVinculo } from './04-acceso.repository.js'
export { contrasenaVigente, usuarioDe, usuarioHabilitado } from './05-autorizacion.js'
export { ACCIONES, VISTAS, type Accesos, type Permiso } from './06-permisos.catalogo.js'
export { accesosEfectivos, MARCA_PERMISO, requierePermiso } from './07-requiere-permiso.js'
export { crearRouterUsuarios } from './08-usuarios.routes.js'

/** Protección de /api/v1/admin/*: token válido (401) y Usuario activo vinculado (403). */
export const autenticar = (identidad: Pick<ProveedorIdentidad, 'verificarToken'>): RequestHandler[] => [
  autenticacion(identidad.verificarToken),
  usuarioHabilitado,
]
