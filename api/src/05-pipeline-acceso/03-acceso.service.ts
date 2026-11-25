import type { ProveedorIdentidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { marcarContrasenaCambiada, registrarAcceso, type Usuario } from './04-acceso.repository.js'

/** Contrato de la sesión (docs/fase-1/contratos-A.md §4.4). Nunca expone `firebaseUid`. */
export interface Sesion {
  id: number
  correo: string
  nombre: string
  telefono: string | null
  rol: string
  activo: boolean
  debeCambiarContrasena: boolean
  ultimoAcceso: string | null
}

export const aSesion = (usuario: Usuario): Sesion => ({
  id: usuario.id,
  correo: usuario.correo,
  nombre: usuario.nombre,
  telefono: usuario.telefono,
  rol: usuario.rol,
  activo: usuario.activo,
  debeCambiarContrasena: usuario.debeCambiarContrasena,
  ultimoAcceso: usuario.ultimoAcceso?.toISOString() ?? null,
})

/** Inicio de sesión: registra la fecha (UTC) y devuelve la sesión actualizada. */
export async function iniciarSesion(usuario: Usuario): Promise<Sesion> {
  return aSesion(await registrarAcceso(usuario.id))
}

/**
 * Cambio de la contraseña propia: primero en el proveedor (que revoca los tokens
 * anteriores) y después se libera la obligación de cambiarla.
 */
export async function cambiarContrasena(
  usuario: Usuario,
  contrasena: string,
  identidad: Pick<ProveedorIdentidad, 'actualizarContrasena'>,
): Promise<void> {
  await identidad.actualizarContrasena(usuario.firebaseUid, contrasena)
  await marcarContrasenaCambiada(usuario.id)
}
