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
