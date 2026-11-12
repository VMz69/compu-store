import { templateAccess } from '../06-pipeline-sesion-permisos/03-access'
import type { User } from '../06-pipeline-sesion-permisos/05-types'

/**
 * Contraseña inicial de todos los usuarios de prueba.
 * Solo se muestra en el login si VITE_SHOW_DEMO_CREDENTIALS=true.
 * Los hashes de abajo se calcularon con lib/password.ts (SHA-256 + sal).
 */
export const DEMO_PASSWORD = 'Compu2026!'

/** Sin foto: `UserAvatar` genera la imagen con las iniciales (shared/lib/initialsAvatar). */
export const DEFAULT_AVATAR = ''

type SeedUser = Omit<User, 'access'>

/**
 * El dueño (propietario@) usa la plantilla de Gerencia General. La cuenta de
 * Super Administrador es del Administrador de Sistema (soporte técnico de la plataforma).
 */
const SEED: SeedUser[] = [
  {
    id: 6,
    name: 'Ing. Diego Rivas',
    email: 'sistemas@compustoresv.com',
    phone: '7230-1188',
    role: 'superadmin',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$d4e8b1f60a2c9375$3e32f4e5ba49ed6560963069420eb89bf1ebbeb9eac85e5c35288b036d0f8775',
    mustChangePassword: false,
    createdAt: '2026-01-02T09:00:00.000Z',
    lastLoginAt: '2026-11-09T07:45:00.000Z',
  },
  {
    id: 1,
    name: 'Lic. Carlos Mendoza',
    email: 'propietario@compustoresv.com',
    phone: '7038-8225',
    role: 'gerencia',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$a3f9c1d27e4b8a06$4c983017af3e96d55247c1afb4b9f70a5a71d27b0e20b2f8a47a73bf528835fa',
    mustChangePassword: false,
    createdAt: '2026-01-05T09:00:00.000Z',
    lastLoginAt: '2026-11-04T08:12:00.000Z',
  },
  {
    id: 2,
    name: 'Ing. Marvin Castro',
    email: 'gerencia@compustoresv.com',
    phone: '7012-4455',
    role: 'gerencia',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$5be2d90f13c7a84e$15ea62b9c1c2a69d92254d1c7c522aceda29decf88450a6cc9e2fbefc6bce10e',
    mustChangePassword: false,
    createdAt: '2026-01-12T09:00:00.000Z',
    lastLoginAt: '2026-11-03T16:40:00.000Z',
  },
  {
    id: 3,
    name: 'Licda. Sofía Alvarado',
    email: 'admin@compustoresv.com',
    phone: '7155-3010',
    role: 'administracion',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$c71e04a9b62f3d58$57c0fcd4f59b0a3fa29d1a716900c7308bf7b3e650827a73e19fb8e7a6cba546',
    mustChangePassword: false,
    createdAt: '2026-02-02T09:00:00.000Z',
    lastLoginAt: '2026-11-04T07:55:00.000Z',
  },
  {
    id: 4,
    name: 'José Henríquez',
    email: 'caja@compustoresv.com',
    phone: '6833-7781',
    role: 'caja_inventario',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$9d4a7f2e01b6c35c$9c9bd88b8e32d03daad7bb82979002bd797d8a90e864999631162213777031aa',
    mustChangePassword: false,
    createdAt: '2026-03-15T09:00:00.000Z',
    lastLoginAt: '2026-11-04T08:01:00.000Z',
  },
  {
    id: 5,
    name: 'Gabriela Solís',
    email: 'soporte@compustoresv.com',
    phone: '6120-4433',
    role: 'servicio_cliente',
    avatar: DEFAULT_AVATAR,
    active: true,
    passwordHash: 'sha256$e08b3c5d7a19f246$8da7283a1435b38e325d704e081a17dfc742db37ae70c568dc3ad7ab6148232f',
    // Ejemplo del flujo "cambiar contraseña en el primer ingreso".
    mustChangePassword: true,
    createdAt: '2026-10-28T09:00:00.000Z',
    lastLoginAt: null,
  },
]

/** Cada usuario arranca con los accesos de la plantilla de su rol. */
export const USERS_MOCK: User[] = SEED.map((u) => ({ ...u, access: templateAccess(u.role) }))
