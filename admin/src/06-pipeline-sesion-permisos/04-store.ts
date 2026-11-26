import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { effectiveAccess } from './03-access'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { configureSessionRejected, notifyAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { normalizeEmail } from '../08-pipeline-edicion-usuarios/03-userRules'
import { changeOwnPassword, INVALID_CREDENTIALS, isCurrentPassword, signIn, signOutSession, watchSession } from './06-sesion.api'
import { createUserApi, deleteUserApi, fetchUsers, resetPasswordApi, updateAccessApi, updateUserApi } from './07-usuarios.api'
import type { LoginResult, NewUserInput, Session, User, UserAccess, UserProfile } from './05-types'

/**
 * Store de acceso: usuarios del sistema + sesión activa.
 *
 * L03: la sesión es real (Firebase Auth + `/admin/sesion`, ver 06-sesion.api).
 * L09: Ajustes › Usuarios es real (`/admin/usuarios`, ver 07-usuarios.api). La lista se carga
 * si la sesión tiene la vista Ajustes; las reglas (último superadmin, uno mismo, escalada)
 * las impone la API, y sus mensajes llegan como toast.
 *
 * Responsabilidad: datos y operaciones atómicas.
 * Las validaciones de permisos y reglas de negocio viven en los hooks
 * (`useUsersAdmin`, `useUserForm`…), no aquí.
 */
interface AccessState {
  users: User[]
  session: Session | null
  isLoading: boolean

  /** Verifica credenciales. Mensaje genérico para no revelar qué dato falló. */
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void

  createUser: (input: NewUserInput) => Promise<User>
  /** Si cambia el rol, la API reinicia los accesos a la plantilla del nuevo rol. */
  updateUser: (id: number, profile: UserProfile) => Promise<void>
  /** Guarda las vistas y acciones del usuario (RBAC por vistas). */
  updateAccess: (id: number, access: UserAccess) => Promise<void>
  /** Contraseña propia (cambio obligatorio) o restablecimiento de la de otro usuario. */
  setPassword: (id: number, password: string, mustChangePassword: boolean) => Promise<void>
  /** ¿Coincide con la contraseña actual de la sesión? (regla "distinta de la temporal"). */
  isCurrentPassword: (password: string) => Promise<boolean>
  /** Optimista: si la API lo rechaza, se revierte y se avisa. */
  setActive: (id: number, active: boolean) => void
  /** Optimista: si la API lo rechaza, se revierte y se avisa. */
  deleteUser: (id: number) => void
}

const replaceUser = (users: User[], user: User) => users.map((u) => (u.id === user.id ? user : u))
const patchUser = (users: User[], id: number, patch: Partial<User>) =>
  users.map((u) => (u.id === id ? { ...u, ...patch } : u))

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/**
 * Versión del esquema persistido.
 * v0–v5: usuarios de prueba con hashes en el navegador (modo mocking-first) ·
 * v6: sesión real (L03); solo se guarda en caché el usuario de la sesión.
 */
const ACCESS_SCHEMA_VERSION = 6

/** Estado con sesión (o sin ella) a partir del usuario que confirmó la API. */
const sessionState = (user: User | null): Pick<AccessState, 'users' | 'session'> =>
  user ? { users: [user], session: { userId: user.id } } : { users: [], session: null }

/** Lista de usuarios de Ajustes: solo para quien tiene esa vista (la API devolvería 403). */
async function loadUsers(sessionUser: User): Promise<void> {
  if (!effectiveAccess(sessionUser).views.includes('ajustes')) return
  try {
    const users = await fetchUsers()
    if (useAccessStore.getState().session?.userId === sessionUser.id) useAccessStore.setState({ users })
  } catch {
    // Silencioso: la vista sigue mostrando al menos el usuario de la sesión.
  }
}

/**
 * La API confirmó al usuario. Con contraseña temporal no se cargan datos (la API respondería
 * 403 PASSWORD_CHANGE_REQUIRED): primero la pantalla de cambio obligatorio.
 */
function onSessionConfirmed(user: User): void {
  if (user.mustChangePassword) return
  notifyAuthenticated()
  void loadUsers(user)
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const user = await signIn(normalizeEmail(email), password)
          set({ ...sessionState(user), isLoading: false })
          onSessionConfirmed(user)
          return { ok: true, user }
        } catch (error) {
          set({ isLoading: false })
          return { ok: false, error: error instanceof Error ? error.message : INVALID_CREDENTIALS }
        }
      },

      logout: () => {
        set(sessionState(null))
        void signOutSession().catch(() => undefined)
      },

      createUser: async (input) => {
        set({ isLoading: true })
        try {
          const user = await createUserApi(input)
          set((s) => ({ users: [...s.users, user], isLoading: false }))
          return user
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudo crear el usuario.'), 'danger')
          throw error
        }
      },

      updateUser: async (id, profile) => {
        set({ isLoading: true })
        try {
          const user = await updateUserApi(id, profile)
          set((s) => ({ users: replaceUser(s.users, user), isLoading: false }))
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudo guardar el usuario.'), 'danger')
          throw error
        }
      },

      updateAccess: async (id, access) => {
        set({ isLoading: true })
        try {
          const user = await updateAccessApi(id, access)
          set((s) => ({ users: replaceUser(s.users, user), isLoading: false }))
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudieron guardar los accesos.'), 'danger')
          throw error
        }
      },

      setPassword: async (id, password, mustChangePassword) => {
        set({ isLoading: true })
        try {
          if (id === get().session?.userId) {
            const user = await changeOwnPassword(password)
            set({ ...sessionState(user), isLoading: false })
            onSessionConfirmed(user) // tras el cambio obligatorio, se cargan los datos
          } else {
            await resetPasswordApi(id, password, mustChangePassword)
            set((s) => ({ users: patchUser(s.users, id, { mustChangePassword }), isLoading: false }))
          }
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudo cambiar la contraseña.'), 'danger')
          throw error
        }
      },

      isCurrentPassword: (password) => isCurrentPassword(password),

      setActive: (id, active) => {
        const previous = get().users.find((u) => u.id === id)
        if (!previous) return
        set((s) => ({ users: patchUser(s.users, id, { active }) }))
        updateUserApi(id, { active })
          .then((user) => set((s) => ({ users: replaceUser(s.users, user) })))
          .catch((error: unknown) => {
            set((s) => ({ users: replaceUser(s.users, previous) }))
            toast(errorMessage(error, 'No se pudo cambiar el estado del usuario.'), 'danger')
          })
      },

      deleteUser: (id) => {
        const index = get().users.findIndex((u) => u.id === id)
        if (index < 0) return
        const removed = get().users[index]!
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
        deleteUserApi(id).catch((error: unknown) => {
          // Se reinserta en su posición original (p. ej. 409: tiene historial, desactívalo).
          set((s) => (s.users.some((u) => u.id === id) ? s : { users: [...s.users.slice(0, index), removed, ...s.users.slice(index)] }))
          toast(errorMessage(error, 'No se pudo eliminar el usuario.'), 'danger')
        })
      },
    }),
    {
      name: STORAGE_KEYS.ACCESS,
      version: ACCESS_SCHEMA_VERSION,
      // Solo se guarda en caché el usuario de la sesión; la lista se relee de la API.
      partialize: (s) => ({ users: s.users.filter((u) => u.id === s.session?.userId), session: s.session }),
      // < v6: datos del modo de prueba (hashes y usuarios demo) → se descartan.
      migrate: () => sessionState(null),
    },
  ),
)

/** Lectura fuera de React (respaldo JSON, sin hashes). */
export const getUsersSnapshot = () =>
  useAccessStore.getState().users.map((u) => ({ ...u, passwordHash: undefined }))

/** Restablecimiento de fábrica (Mantenimiento): no inyecta usuarios demo; conserva solo la sesión real. */
export const resetAccess = (): void => {
  const { session, users } = useAccessStore.getState()
  useAccessStore.setState(sessionState(users.find((u) => u.id === session?.userId) ?? null))
}

// Restaura o invalida la sesión con Firebase + API al cargar, y la cierra si la API la rechaza.
watchSession((user) => {
  useAccessStore.setState(sessionState(user))
  if (user) onSessionConfirmed(user)
})
configureSessionRejected(() => useAccessStore.getState().logout())
