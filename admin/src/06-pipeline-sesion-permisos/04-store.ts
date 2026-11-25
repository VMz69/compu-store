import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/84-pipeline-persistencia-demo/04-delay'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { normalizeAccess, templateAccess } from './03-access'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { configureSessionRejected, notifyAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { hashPassword } from '../10-pipeline-cambio-contrasena/04-password'
import { normalizeEmail } from '../08-pipeline-edicion-usuarios/03-userRules'
import { DEFAULT_AVATAR } from '../86-pipeline-datos-demo-personas/02-users.mock'
import { changeOwnPassword, INVALID_CREDENTIALS, isCurrentPassword, signIn, signOutSession, watchSession } from './06-sesion.api'
import type { LoginResult, NewUserInput, Session, User, UserAccess, UserProfile } from './05-types'

/**
 * Store de acceso: usuarios del sistema + sesión activa.
 *
 * L03: la sesión es real (Firebase Auth + `/admin/sesion`, ver 06-sesion.api). `users`
 * contiene solo al usuario de la sesión; la administración de usuarios (alta, edición,
 * restablecimiento de otros) sigue local hasta L09 y se bloquea en producción en L08.
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
  /** Si cambia el rol, los accesos se reinician a la plantilla del nuevo rol. */
  updateUser: (id: number, profile: UserProfile) => Promise<void>
  /** Guarda las vistas y acciones del usuario (RBAC por vistas). */
  updateAccess: (id: number, access: UserAccess) => Promise<void>
  /** Define una contraseña nueva. En L03 solo la propia (cambio obligatorio); la de otros, en L09. */
  setPassword: (id: number, password: string, mustChangePassword: boolean) => Promise<void>
  /** ¿Coincide con la contraseña actual de la sesión? (regla "distinta de la temporal"). */
  isCurrentPassword: (password: string) => Promise<boolean>
  setActive: (id: number, active: boolean) => void
  deleteUser: (id: number) => void
}

const patchUser = (users: User[], id: number, patch: Partial<User>) =>
  users.map((u) => (u.id === id ? { ...u, ...patch } : u))

/**
 * Versión del esquema persistido.
 * v0–v5: usuarios de prueba con hashes en el navegador (modo mocking-first) ·
 * v6: sesión real (L03); solo se guarda en caché el usuario de la sesión.
 */
const ACCESS_SCHEMA_VERSION = 6

/** Estado con sesión (o sin ella) a partir del usuario que confirmó la API. */
const sessionState = (user: User | null): Pick<AccessState, 'users' | 'session'> =>
  user ? { users: [user], session: { userId: user.id } } : { users: [], session: null }

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
          notifyAuthenticated()
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

      createUser: async ({ password, ...input }) => {
        set({ isLoading: true })
        const passwordHash = await hashPassword(password)
        await delay()
        const user: User = {
          ...input,
          email: normalizeEmail(input.email),
          id: Math.max(0, ...get().users.map((u) => u.id)) + 1,
          avatar: DEFAULT_AVATAR,
          passwordHash,
          access: templateAccess(input.role),
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
        }
        set((s) => ({ users: [...s.users, user], isLoading: false }))
        return user
      },

      updateUser: async (id, profile) => {
        set({ isLoading: true })
        await delay()
        set((s) => {
          const current = s.users.find((u) => u.id === id)
          const roleChanged = current && current.role !== profile.role
          return {
            users: patchUser(s.users, id, {
              ...profile,
              email: normalizeEmail(profile.email),
              ...(roleChanged ? { access: templateAccess(profile.role) } : {}),
            }),
            isLoading: false,
          }
        })
      },

      updateAccess: async (id, access) => {
        set({ isLoading: true })
        await delay()
        set((s) => ({ users: patchUser(s.users, id, { access: normalizeAccess(access) }), isLoading: false }))
      },

      setPassword: async (id, password) => {
        if (id !== get().session?.userId) {
          toast('Restablecer la contraseña de otros usuarios estará disponible en la Fase B.', 'warning')
          return
        }
        set({ isLoading: true })
        try {
          const user = await changeOwnPassword(password)
          set({ ...sessionState(user), isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          toast(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.', 'danger')
          throw error
        }
      },

      isCurrentPassword: (password) => isCurrentPassword(password),

      setActive: (id, active) => set((s) => ({ users: patchUser(s.users, id, { active }) })),

      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.ACCESS,
      version: ACCESS_SCHEMA_VERSION,
      partialize: (s) => ({ users: s.users, session: s.session }),
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
  if (user) notifyAuthenticated()
})
configureSessionRejected(() => useAccessStore.getState().logout())
