import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import { toAccesosDto, toUser, type SessionDto } from './06-sesion.api'
import type { NewUserInput, User, UserAccess, UserProfile } from './05-types'

/**
 * Adaptador de Ajustes › Usuarios (L09): `/admin/usuarios` ↔ `User` del admin.
 * Las reglas (último superadmin, uno mismo, escalada) las impone la API; aquí solo se traduce.
 */

type Respuesta<T> = { data: T }

const toPerfilDto = (profile: Partial<UserProfile>) => ({
  ...(profile.name === undefined ? {} : { nombre: profile.name.trim() }),
  ...(profile.email === undefined ? {} : { correo: profile.email.trim().toLowerCase() }),
  ...(profile.phone === undefined ? {} : { telefono: profile.phone.trim() || null }),
  ...(profile.role === undefined ? {} : { rol: profile.role }),
  ...(profile.active === undefined ? {} : { activo: profile.active }),
})

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<Respuesta<SessionDto[]>>('/admin/usuarios')
  return data.data.map(toUser)
}

export async function createUserApi({ password, mustChangePassword, ...profile }: NewUserInput): Promise<User> {
  const { data } = await apiClient.post<Respuesta<SessionDto>>('/admin/usuarios', {
    ...toPerfilDto(profile),
    contrasena: password,
    debeCambiarContrasena: mustChangePassword,
  })
  return toUser(data.data)
}

/** Perfil completo (formulario) o parcial (interruptor de activo). */
export async function updateUserApi(id: number, profile: Partial<UserProfile>): Promise<User> {
  const { data } = await apiClient.patch<Respuesta<SessionDto>>(`/admin/usuarios/${id}`, toPerfilDto(profile))
  return toUser(data.data)
}

export async function updateAccessApi(id: number, access: UserAccess): Promise<User> {
  const { data } = await apiClient.put<Respuesta<SessionDto>>(`/admin/usuarios/${id}/accesos`, toAccesosDto(access))
  return toUser(data.data)
}

export async function resetPasswordApi(id: number, password: string, mustChangePassword: boolean): Promise<void> {
  await apiClient.put(`/admin/usuarios/${id}/contrasena`, { contrasena: password, debeCambiarContrasena: mustChangePassword })
}

export async function deleteUserApi(id: number): Promise<void> {
  await apiClient.delete(`/admin/usuarios/${id}`)
}
