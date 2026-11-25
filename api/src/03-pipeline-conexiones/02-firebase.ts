import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { env } from '../02-env.js'

/** Identidad comprobada por el proveedor (D-01): Firebase identifica, MariaDB habilita. */
export interface Identidad {
  uid: string
  correo: string | null
}

/**
 * Operaciones del proveedor de identidad que usa la API. Se inyecta en `crearApp`
 * para que las pruebas usen un proveedor falso sin credenciales.
 */
export interface ProveedorIdentidad {
  /** Verifica un ID token; lanza un error si es inválido, ha expirado o fue revocado. */
  verificarToken: (token: string) => Promise<Identidad>
  /** Fija la contraseña de una cuenta (revoca sus sesiones abiertas). */
  actualizarContrasena: (uid: string, contrasena: string) => Promise<void>
  /** uid de la cuenta con ese correo, o null si no existe. */
  buscarPorCorreo: (correo: string) => Promise<string | null>
}

const VARIABLES_FIREBASE = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const

/** Lanza un error que nombra las variables de Firebase que faltan (nunca sus valores). */
export function comprobarConfiguracionFirebase(): void {
  const faltantes = VARIABLES_FIREBASE.filter((clave) => !env[clave])
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de Firebase: ${faltantes.join(', ')} (ver api/README.md).`)
  }
}

let auth: Auth | undefined

/** Inicialización perezosa: nada se conecta hasta la primera verificación. */
function obtenerAuth(): Auth {
  if (auth) return auth
  comprobarConfiguracionFirebase()
  const app: App =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID!,
        clientEmail: env.FIREBASE_CLIENT_EMAIL!,
        privateKey: env.FIREBASE_PRIVATE_KEY!,
      }),
    })
  auth = getAuth(app)
  return auth
}

const esUsuarioInexistente = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'auth/user-not-found'

/** Proveedor real sobre el Admin SDK de Firebase. */
export const proveedorFirebase: ProveedorIdentidad = {
  async verificarToken(token) {
    // checkRevoked: un cambio de contraseña invalida los tokens emitidos antes.
    const decodificado = await obtenerAuth().verifyIdToken(token, true)
    return { uid: decodificado.uid, correo: decodificado.email ?? null }
  },
  async actualizarContrasena(uid, contrasena) {
    await obtenerAuth().updateUser(uid, { password: contrasena })
  },
  async buscarPorCorreo(correo) {
    try {
      return (await obtenerAuth().getUserByEmail(correo)).uid
    } catch (error) {
      if (esUsuarioInexistente(error)) return null
      throw error
    }
  },
}
