import { FirebaseError, initializeApp } from 'firebase/app'
import {
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth'
import { ApiError, apiClient, configureToken } from '@/84-pipeline-persistencia-demo/05-api.client'
import { ROLES } from '../86-pipeline-datos-demo-personas/00-director-datos-demo-personas'
import { DEFAULT_AVATAR } from '../86-pipeline-datos-demo-personas/02-users.mock'
import { templateAccess } from './03-access'
import type { RoleId, User } from './05-types'

/**
 * Adaptador de sesión (L03, D-01): Firebase Auth identifica al colaborador y la API
 * (`/admin/sesion`) confirma que está vinculado a un Usuario activo. Traduce el contrato
 * de la API (español, contratos-A §4.4) al tipo `User` del admin.
 */

/** Sesión tal como la devuelve la API. */
interface SessionDto {
  id: number
  correo: string
  nombre: string
  telefono: string | null
  rol: string
  activo: boolean
  debeCambiarContrasena: boolean
  ultimoAcceso: string | null
}

export const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.'

let auth: Auth | null = null

/** Inicialización perezosa: sin configuración, el admin carga y el login explica qué falta. */
function getFirebaseAuth(): Auth {
  if (auth) return auth
  const env = import.meta.env
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_AUTH_DOMAIN || !env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('Falta configurar Firebase en admin/.env (VITE_FIREBASE_*).')
  }
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  auth = getAuth(app)
  return auth
}

configureToken(async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null))

const isRoleId = (rol: string): rol is RoleId => Object.hasOwn(ROLES, rol)

/** Contrato de la API → `User` del admin. Sin contraseña ni hash: viven en Firebase. */
function toUser(dto: SessionDto): User {
  if (!isRoleId(dto.rol)) throw new ApiError('Tu cuenta tiene un rol desconocido. Contacta al administrador.', 403, 'FORBIDDEN')
  return {
    id: dto.id,
    name: dto.nombre,
    email: dto.correo,
    phone: dto.telefono ?? '',
    role: dto.rol,
    access: templateAccess(dto.rol),
    avatar: DEFAULT_AVATAR,
    active: dto.activo,
    passwordHash: '',
    mustChangePassword: dto.debeCambiarContrasena,
    createdAt: '',
    lastLoginAt: dto.ultimoAcceso,
  }
}

/** Mensaje para el usuario a partir de un error de Firebase Auth (sin revelar qué dato falló). */
function authErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) return error instanceof Error ? error.message : 'No se pudo iniciar sesión.'
  switch (error.code) {
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos o restablece tu contraseña.'
    case 'auth/user-disabled':
      return 'Tu cuenta está desactivada. Contacta al administrador.'
    case 'auth/network-request-failed':
      return 'No se pudo conectar. Revisa tu conexión a internet.'
    default:
      return INVALID_CREDENTIALS
  }
}

const fetchSession = async (method: 'get' | 'post'): Promise<User> => {
  const { data } = await apiClient.request<{ data: SessionDto }>({ method, url: '/admin/sesion' })
  return toUser(data.data)
}

/** Inicio de sesión: Firebase verifica la contraseña y la API registra el acceso. */
export async function signIn(email: string, password: string): Promise<User> {
  const firebaseAuth = getFirebaseAuth()
  try {
    await signInWithEmailAndPassword(firebaseAuth, email, password)
  } catch (error) {
    throw new Error(authErrorMessage(error), { cause: error })
  }
  try {
    return await fetchSession('post')
  } catch (error) {
    await signOut(firebaseAuth) // identidad válida, pero sin acceso al panel
    throw error
  }
}

export async function signOutSession(): Promise<void> {
  if (auth) await signOut(auth)
}

/**
 * Restaura o invalida la sesión al cargar la página y cuando Firebase cambia de usuario.
 * `null` = sin sesión (o rechazada por la API). Ante un fallo de red se conserva la sesión en caché.
 */
export function watchSession(onChange: (user: User | null) => void): void {
  let firebaseAuth: Auth
  try {
    firebaseAuth = getFirebaseAuth()
  } catch {
    onChange(null)
    return
  }
  onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null)
      return
    }
    try {
      onChange(await fetchSession('get'))
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await signOut(firebaseAuth)
        onChange(null)
      }
    }
  })
}

/**
 * Cambio de la contraseña propia en el servidor. La API revoca los tokens anteriores,
 * así que se vuelve a iniciar sesión con la contraseña nueva.
 */
export async function changeOwnPassword(password: string): Promise<User> {
  const firebaseAuth = getFirebaseAuth()
  const email = firebaseAuth.currentUser?.email
  if (!email) throw new Error('La sesión expiró. Vuelve a iniciar sesión.')
  await apiClient.put('/admin/sesion/contrasena', { contrasena: password })
  await signInWithEmailAndPassword(firebaseAuth, email, password)
  return fetchSession('get')
}

/** ¿La contraseña coincide con la actual? (regla "distinta de la temporal"). */
export async function isCurrentPassword(password: string): Promise<boolean> {
  const user = auth?.currentUser
  if (!user?.email) return false
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
    return true
  } catch {
    return false
  }
}
