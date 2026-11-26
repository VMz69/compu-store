import type { Usuario } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

export type { Usuario }

export const buscarPorFirebaseUid = (firebaseUid: string): Promise<Usuario | null> =>
  prisma.usuario.findUnique({ where: { firebaseUid } })

export const registrarAcceso = (id: number): Promise<Usuario> =>
  prisma.usuario.update({ where: { id }, data: { ultimoAcceso: new Date() } })

export const marcarContrasenaCambiada = (id: number): Promise<Usuario> =>
  prisma.usuario.update({ where: { id }, data: { debeCambiarContrasena: false } })

/** Claves de permiso guardadas para el usuario (se leen en cada petición, sin caché). */
export const clavesDeUsuario = async (usuarioId: number): Promise<string[]> =>
  (await prisma.usuarioPermiso.findMany({ where: { usuarioId }, select: { permisoClave: true } })).map((p) => p.permisoClave)

/** Claves de la plantilla de un rol. */
export const clavesDePlantilla = async (rolId: string): Promise<string[]> =>
  (await prisma.rolPermiso.findMany({ where: { rolId }, select: { permisoClave: true } })).map((p) => p.permisoClave)

export interface DatosVinculo {
  firebaseUid: string
  correo: string
  nombre: string
  telefono: string | null
  rol: string
  debeCambiarContrasena: boolean
}

/**
 * Vincula una cuenta de Firebase con su Usuario (idempotente, por `firebaseUid`).
 * Al repetirse actualiza el perfil, pero no toca `activo` ni el último acceso.
 * Si el usuario es nuevo o cambia de rol, sus accesos se reinician a la plantilla del rol (L09).
 */
export const vincular = ({ firebaseUid, ...perfil }: DatosVinculo): Promise<Usuario> =>
  prisma.$transaction(async (tx) => {
    const previo = await tx.usuario.findUnique({ where: { firebaseUid }, select: { rol: true } })
    const usuario = await tx.usuario.upsert({ where: { firebaseUid }, create: { firebaseUid, ...perfil }, update: perfil })
    if (previo?.rol !== usuario.rol) {
      const plantilla = await tx.rolPermiso.findMany({ where: { rolId: usuario.rol }, select: { permisoClave: true } })
      await tx.usuarioPermiso.deleteMany({ where: { usuarioId: usuario.id } })
      if (usuario.rol !== 'superadmin' && plantilla.length > 0) {
        await tx.usuarioPermiso.createMany({ data: plantilla.map((p) => ({ usuarioId: usuario.id, permisoClave: p.permisoClave })) })
      }
    }
    return usuario
  })
