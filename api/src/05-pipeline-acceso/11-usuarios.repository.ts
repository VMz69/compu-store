import { Prisma, type Usuario } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

/** Cliente de Prisma dentro o fuera de una transacción. */
export type Tx = Prisma.TransactionClient

const CON_PERMISOS = { permisos: { select: { permisoClave: true } } } as const satisfies Prisma.UsuarioInclude
export type UsuarioConPermisos = Prisma.UsuarioGetPayload<{ include: typeof CON_PERMISOS }>

export interface UsuarioNuevo {
  firebaseUid: string
  correo: string
  nombre: string
  telefono: string | null
  rol: string
  activo: boolean
  debeCambiarContrasena: boolean
  /** Claves de permiso propias (vacío para superadmin). */
  permisos: string[]
}

/** `undefined` = sin cambio (Prisma lo ignora). */
export type CambiosUsuario = {
  [K in 'nombre' | 'correo' | 'telefono' | 'rol' | 'activo' | 'debeCambiarContrasena']?: Usuario[K] | undefined
}

/* ---------- Lectura ---------- */

export const listar = (): Promise<UsuarioConPermisos[]> =>
  prisma.usuario.findMany({ include: CON_PERMISOS, orderBy: { id: 'asc' } })

export const obtenerOpcional = (id: number): Promise<UsuarioConPermisos | null> =>
  prisma.usuario.findUnique({ where: { id }, include: CON_PERMISOS })

export const obtener = (id: number): Promise<UsuarioConPermisos> =>
  prisma.usuario.findUniqueOrThrow({ where: { id }, include: CON_PERMISOS })

/** ¿El correo pertenece a otro usuario? */
export const correoEnUso = async (tx: Tx, correo: string, exceptoId?: number): Promise<boolean> =>
  (await tx.usuario.count({ where: { correo, ...(exceptoId === undefined ? {} : { id: { not: exceptoId } }) } })) > 0

export const contarMovimientos = (tx: Tx, usuarioId: number): Promise<number> =>
  tx.movimientoInventario.count({ where: { usuarioId } })

/* ---------- Bloqueos (protección del último superadmin) ---------- */

/**
 * Bloquea las filas de los superadmins activos hasta el fin de la transacción (en orden de id,
 * para no provocar interbloqueos) y devuelve sus ids. Dos peticiones que intenten retirar a
 * superadmins distintos a la vez se serializan aquí, así que nunca quedan 0.
 */
export async function bloquearSuperadminsActivos(tx: Tx): Promise<number[]> {
  const filas = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM usuarios WHERE rol = 'superadmin' AND activo = 1 ORDER BY id FOR UPDATE`
  return filas.map((f) => Number(f.id))
}

/** Bloquea la fila del usuario y la devuelve (null si no existe). */
export async function bloquear(tx: Tx, id: number): Promise<Usuario | null> {
  await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${id} FOR UPDATE`
  return tx.usuario.findUnique({ where: { id } })
}

/* ---------- Escritura ---------- */

export const crear = ({ permisos, ...datos }: UsuarioNuevo): Promise<UsuarioConPermisos> =>
  prisma.usuario.create({
    data: { ...datos, permisos: { create: permisos.map((permisoClave) => ({ permisoClave })) } },
    include: CON_PERMISOS,
  })

export const actualizar = (tx: Tx, id: number, cambios: CambiosUsuario): Promise<Usuario> => {
  const data: Prisma.UsuarioUncheckedUpdateInput = Object.fromEntries(Object.entries(cambios).filter(([, valor]) => valor !== undefined))
  return tx.usuario.update({ where: { id }, data })
}

export async function reemplazarPermisos(tx: Tx, usuarioId: number, claves: string[]): Promise<void> {
  await tx.usuarioPermiso.deleteMany({ where: { usuarioId } })
  if (claves.length > 0) await tx.usuarioPermiso.createMany({ data: claves.map((permisoClave) => ({ usuarioId, permisoClave })) })
}

/** Borra el usuario (sus permisos se van en cascada). */
export async function borrar(tx: Tx, id: number): Promise<void> {
  await tx.usuario.delete({ where: { id } })
}

/** Violación del índice único del correo (carrera entre la comprobación previa y el insert). */
export const esCorreoDuplicado = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
