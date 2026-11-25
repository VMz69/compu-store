import type { Usuario } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

export type { Usuario }

export const buscarPorFirebaseUid = (firebaseUid: string): Promise<Usuario | null> =>
  prisma.usuario.findUnique({ where: { firebaseUid } })

export const registrarAcceso = (id: number): Promise<Usuario> =>
  prisma.usuario.update({ where: { id }, data: { ultimoAcceso: new Date() } })

export const marcarContrasenaCambiada = (id: number): Promise<Usuario> =>
  prisma.usuario.update({ where: { id }, data: { debeCambiarContrasena: false } })

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
 */
export const vincular = ({ firebaseUid, ...perfil }: DatosVinculo): Promise<Usuario> =>
  prisma.usuario.upsert({ where: { firebaseUid }, create: { firebaseUid, ...perfil }, update: perfil })
