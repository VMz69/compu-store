/**
 * Catálogo de permisos (L09): espejo en código de la tabla `permisos` (migración `rbac`), que a su
 * vez copia `VIEW_CATALOG` del admin. Una prueba verifica que la tabla y estas constantes coinciden.
 * Las vistas siguen el orden del menú (la primera habilitada es la de inicio).
 */
export const VISTAS = [
  'tablero',
  'productos',
  'pedidos',
  'facturacion',
  'clientes',
  'categorias',
  'ofertas',
  'cotizaciones',
  'interacciones',
  'ajustes',
] as const
export type Vista = (typeof VISTAS)[number]

export const ACCIONES = [
  'productos.crear',
  'productos.editar',
  'productos.eliminar',
  'productos.existencias',
  'productos.visibilidad',
  'pedidos.gestionar',
  'pedidos.reservar',
  'pedidos.eliminar',
  'facturacion.emitir',
  'clientes.gestionar',
  'clientes.eliminar',
  'categorias.gestionar',
  'ofertas.gestionar',
  'cotizaciones.gestionar',
  'interacciones.moderar',
  'ajustes.usuarios',
  'ajustes.configuracion',
] as const
export type Accion = (typeof ACCIONES)[number]

export type Permiso = Vista | Accion

export const SUPERADMIN = 'superadmin'

/** Vistas y acciones de un usuario (contrato JSON `accesos`). */
export interface Accesos {
  vistas: Vista[]
  acciones: Accion[]
}

/** Vista a la que pertenece una acción ("productos.crear" → "productos"). */
export const vistaDe = (accion: Accion): Vista => accion.slice(0, accion.indexOf('.')) as Vista

export const esVista = (clave: string): clave is Vista => (VISTAS as readonly string[]).includes(clave)
export const esAccion = (clave: string): clave is Accion => (ACCIONES as readonly string[]).includes(clave)

/** Accesos consistentes: orden del catálogo y solo acciones cuya vista esté habilitada (= `normalizeAccess` del admin). */
export function normalizarAccesos(claves: Iterable<string>): Accesos {
  const conjunto = new Set(claves)
  const vistas = VISTAS.filter((v) => conjunto.has(v))
  return { vistas, acciones: ACCIONES.filter((a) => conjunto.has(a) && vistas.includes(vistaDe(a))) }
}

export const ACCESO_TOTAL: Accesos = { vistas: [...VISTAS], acciones: [...ACCIONES] }

/** Claves planas de unos accesos (para guardarlos o compararlos). */
export const clavesDe = (accesos: Accesos): Permiso[] => [...accesos.vistas, ...accesos.acciones]
