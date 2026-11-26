import type { ProveedorIdentidad } from '../src/03-pipeline-conexiones/00-director-conexiones.js'
import { prisma } from '../src/03-pipeline-conexiones/00-director-conexiones.js'

/**
 * Sesión de prueba reutilizable para los endpoints /admin/*: un proveedor de identidad
 * falso ("token-<uid>" es válido para ese uid) y un Usuario habilitado en la BD de pruebas.
 */
const PREFIJO = 'token-'

export const identidadFalsa: ProveedorIdentidad = {
  verificarToken: async (token) => {
    if (!token.startsWith(PREFIJO)) throw new Error('token inválido')
    return { uid: token.slice(PREFIJO.length), correo: null }
  },
  actualizarContrasena: async () => {},
  buscarPorCorreo: async () => null,
  // L09: las pruebas de usuarios (tests/12) usan su propio proveedor con espías.
  crearCuenta: async (correo) => `falso-${correo}`,
  actualizarCuenta: async () => {},
  eliminarCuenta: async () => {},
}

export const bearer = (uid: string) => `Bearer ${PREFIJO}${uid}`

/** Crea (o reactiva) un Usuario superadmin vinculado a `uid`. */
export const crearUsuarioHabilitado = (uid: string) =>
  prisma.usuario.upsert({
    where: { firebaseUid: uid },
    create: { firebaseUid: uid, correo: `${uid}@prueba.test`, nombre: 'Prueba', rol: 'superadmin' },
    update: { activo: true },
  })

export const eliminarUsuario = (uid: string) => prisma.usuario.deleteMany({ where: { firebaseUid: uid } })

/**
 * L09: crea (o reinicia) un Usuario no superadmin con exactamente esas claves de permiso.
 * Devuelve el usuario; `fijarPermisos` cambia sus claves después (se leen en cada petición).
 */
export async function crearUsuarioConPermisos(uid: string, claves: string[], rol = 'caja_inventario') {
  const usuario = await prisma.usuario.upsert({
    where: { firebaseUid: uid },
    create: { firebaseUid: uid, correo: `${uid}@prueba.test`, nombre: 'Prueba RBAC', rol },
    update: { activo: true, rol, debeCambiarContrasena: false },
  })
  await fijarPermisos(usuario.id, claves)
  return usuario
}

export async function fijarPermisos(usuarioId: number, claves: string[]) {
  await prisma.usuarioPermiso.deleteMany({ where: { usuarioId } })
  if (claves.length > 0) await prisma.usuarioPermiso.createMany({ data: claves.map((permisoClave) => ({ usuarioId, permisoClave })) })
}
