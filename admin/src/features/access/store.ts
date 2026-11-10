import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { normalizeAccess, templateAccess } from './lib/access'
import { hashPassword, verifyPassword } from './lib/password'
import { normalizeEmail } from './lib/userRules'
import { DEFAULT_AVATAR, USERS_MOCK } from './mocks/users.mock'
import type { LoginResult, NewUserInput, Session, User, UserAccess, UserProfile } from './types'

/**
 * Store de acceso: usuarios del sistema + sesión activa.
 *
 * Responsabilidad: datos y operaciones atómicas (con latencia simulada).
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
  /** Define una contraseña nueva (alta, restablecimiento o cambio propio). */
  setPassword: (id: number, password: string, mustChangePassword: boolean) => Promise<void>
  setActive: (id: number, active: boolean) => void
  deleteUser: (id: number) => void
}

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.'

const patchUser = (users: User[], id: number, patch: Partial<User>) =>
  users.map((u) => (u.id === id ? { ...u, ...patch } : u))

/**
 * Versión del esquema persistido.
 * v0: sesión por rol (selector de perfiles del demo) · v2: login con credenciales ·
 * v3: avatares generados con iniciales (se descartan las fotos externas de prueba) ·
 * v4: accesos por usuario (vistas + acciones) y Super Administrador = Administrador de Sistema.
 */
const ACCESS_SCHEMA_VERSION = 4

const OWNER_EMAIL = 'propietario@compustoresv.com'

/** v3 → v4: accesos desde la plantilla del rol; el dueño deja de ser Super Administrador. */
function migrateToV4(users: Omit<User, 'access'>[]): User[] {
  const migrated: User[] = users.map((u) => {
    const role = u.email === OWNER_EMAIL && u.role === 'superadmin' ? 'gerencia' : u.role
    return { ...u, role, access: templateAccess(role) }
  })
  // Debe existir un Administrador de Sistema: si no queda ninguno, se agrega la cuenta de fábrica.
  const sysAdmin = USERS_MOCK.find((u) => u.role === 'superadmin')
  if (sysAdmin && !migrated.some((u) => u.role === 'superadmin' && u.active)) {
    const id = migrated.some((u) => u.id === sysAdmin.id) ? Math.max(...migrated.map((u) => u.id)) + 1 : sysAdmin.id
    migrated.unshift({ ...sysAdmin, id })
  }
  return migrated
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      users: USERS_MOCK,
      session: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        await delay()
        const user = get().users.find((u) => normalizeEmail(u.email) === normalizeEmail(email))
        const matches = user ? await verifyPassword(password, user.passwordHash) : false
        if (!user || !matches) {
          set({ isLoading: false })
          return { ok: false, error: INVALID_CREDENTIALS }
        }
        if (!user.active) {
          set({ isLoading: false })
          return { ok: false, error: 'Tu cuenta está desactivada. Contacta al administrador.' }
        }
        const lastLoginAt = new Date().toISOString()
        set((s) => ({ users: patchUser(s.users, user.id, { lastLoginAt }), session: { userId: user.id }, isLoading: false }))
        return { ok: true, user: { ...user, lastLoginAt } }
      },

      logout: () => set({ session: null }),

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

      setPassword: async (id, password, mustChangePassword) => {
        set({ isLoading: true })
        const passwordHash = await hashPassword(password)
        await delay()
        set((s) => ({ users: patchUser(s.users, id, { passwordHash, mustChangePassword }), isLoading: false }))
      },

      setActive: (id, active) => set((s) => ({ users: patchUser(s.users, id, { active }) })),

      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.ACCESS,
      version: ACCESS_SCHEMA_VERSION,
      partialize: (s) => ({ users: s.users, session: s.session }),
      migrate: (persisted, version) => {
        // < v2: los usuarios no tenían contraseña → se reemplazan y se cierra la sesión.
        if (version < 2) return { users: USERS_MOCK, session: null }
        // v2 → v3: se conservan usuarios y sesión; solo se quitan las fotos externas.
        const state = persisted as Pick<AccessState, 'users' | 'session'>
        const users = state.users.map((u) => (u.avatar.includes('unsplash.com') ? { ...u, avatar: DEFAULT_AVATAR } : u))
        return { ...state, users: version < 4 ? migrateToV4(users) : users }
      },
    },
  ),
)

/** Lectura fuera de React (respaldo JSON, sin hashes). */
export const getUsersSnapshot = () =>
  useAccessStore.getState().users.map((u) => ({ ...u, passwordHash: undefined }))

/** Restablecimiento de fábrica: conserva la sesión solo si el usuario sigue existiendo. */
export const resetAccess = (): void => {
  const { session } = useAccessStore.getState()
  const keep = session && USERS_MOCK.some((u) => u.id === session.userId) ? session : null
  useAccessStore.setState({ users: USERS_MOCK, session: keep })
}
