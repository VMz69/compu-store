/** Vistas del back office (primer segmento de la ruta). */
export type ViewId =
  | 'tablero'
  | 'productos'
  | 'pedidos'
  | 'clientes'
  | 'categorias'
  | 'ofertas'
  | 'cotizaciones'
  | 'interacciones'
  | 'facturacion'
  | 'ajustes'

export type RoleId = 'superadmin' | 'gerencia' | 'administracion' | 'caja_inventario' | 'servicio_cliente'

export interface RolePermissions {
  canCreateProduct: boolean
  canEditProduct: boolean
  canDeleteProduct: boolean
  canUpdateStock: boolean
  canToggleVisibility: boolean
  canChangeOrderStatus: boolean
  /** Alta y edición de clientes del directorio. */
  canManageCustomers: boolean
  /** Eliminación de clientes (acción destructiva, más restringida). */
  canDeleteCustomers: boolean
  /** Eliminación (lógica) de pedidos sin factura. Acción destructiva, más restringida. */
  canDeleteOrders: boolean
  /** Emitir cotizaciones, cambiar su estado y eliminarlas. */
  canManageQuotes: boolean
  /** Categorías y marcas: crear, editar y eliminar. */
  canManageTaxonomy: boolean
  /** Ofertas: crear, editar, pausar y eliminar. */
  canManageOffers: boolean
  /** Comentarios del Front Office: aprobar, rechazar y eliminar. */
  canModerateReviews: boolean
  /** Emitir y anular facturas (descuenta y repone stock). */
  canInvoice: boolean
  /** CRUD de usuarios del sistema y sus contraseñas. */
  canManageUsers: boolean
  canEditSettings: boolean
}

export type Permission = keyof RolePermissions

export interface Role extends RolePermissions {
  id: RoleId
  name: string
  title: string
  description: string
  /** Ícono FontAwesome (solo el nombre, ej. "fa-user-shield"). */
  icon: string
  /** Clases completas del badge de rol (light + dark). */
  badgeClass: string
  /** Vistas habilitadas; la primera es la vista de inicio del rol. */
  allowedViews: ViewId[]
}

/**
 * Accesos de un usuario (RBAC por vistas): qué vistas ve y qué acciones puede hacer.
 * Se inicializan con la plantilla de su rol y se ajustan por usuario.
 * El Super Administrador siempre tiene acceso total (no se guarda ni se edita).
 */
export interface UserAccess {
  views: ViewId[]
  permissions: Permission[]
}

/** Colaborador con acceso al back office. */
export interface User {
  id: number
  name: string
  /** Correo único: es el identificador de inicio de sesión. */
  email: string
  phone: string
  /** Plantilla de accesos (y etiqueta del puesto). */
  role: RoleId
  access: UserAccess
  avatar: string
  /** Un usuario inactivo no puede iniciar sesión (y pierde la sesión abierta). */
  active: boolean
  /**
   * Hash de la contraseña con sal: "sha256$<sal>$<hex>".
   * Nunca se guarda la contraseña en texto plano (ver lib/password.ts).
   */
  passwordHash: string
  /** Obliga a definir una contraseña propia en el siguiente inicio de sesión. */
  mustChangePassword: boolean
  /** Fecha ISO de alta. */
  createdAt: string
  /** Fecha ISO del último inicio de sesión exitoso. */
  lastLoginAt: string | null
}

/** Datos editables del perfil (sin credenciales). */
export type UserProfile = Pick<User, 'name' | 'email' | 'phone' | 'role' | 'active'>

/** Alta de usuario: perfil + contraseña inicial en texto plano (se hashea en el store). */
export interface NewUserInput extends UserProfile {
  password: string
  mustChangePassword: boolean
}

/** La sesión solo guarda el id; rol y estado se leen siempre del usuario vigente. */
export interface Session {
  userId: number
}

export type LoginResult = { ok: true; user: User } | { ok: false; error: string }
