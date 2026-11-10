import type { Permission, ViewId } from '../types'

/** Acción que se puede habilitar dentro de una vista. */
export interface ViewAction {
  permission: Permission
  label: string
  description: string
}

export interface ViewDefinition {
  id: ViewId
  label: string
  /** Clase FontAwesome completa. */
  icon: string
  /** Sin acciones = vista de solo consulta. */
  actions: ViewAction[]
}

/**
 * Catálogo de vistas del back office y las acciones de cada una.
 * Única fuente para el menú lateral (`app/nav.config.ts`) y para el RBAC por usuario
 * (Ajustes › Usuarios › Accesos). El orden es el del menú.
 */
export const VIEW_CATALOG: ViewDefinition[] = [
  { id: 'tablero', label: 'Tablero', icon: 'fa-solid fa-border-all', actions: [] },
  {
    id: 'productos', label: 'Productos', icon: 'fa-solid fa-box-open',
    actions: [
      { permission: 'canCreateProduct', label: 'Crear productos', description: 'Agregar artículos nuevos al catálogo.' },
      { permission: 'canEditProduct', label: 'Editar productos', description: 'Cambiar datos, precios, imágenes y especificaciones.' },
      { permission: 'canDeleteProduct', label: 'Eliminar productos', description: 'Quitar artículos del catálogo.' },
      { permission: 'canUpdateStock', label: 'Ajustar existencias', description: 'Sumar o restar stock rápidamente.' },
      { permission: 'canToggleVisibility', label: 'Mostrar/ocultar en la web', description: 'Publicar o retirar productos del Front Office.' },
    ],
  },
  {
    id: 'pedidos', label: 'Pedidos', icon: 'fa-solid fa-cart-shopping',
    actions: [
      { permission: 'canChangeOrderStatus', label: 'Registrar y gestionar pedidos', description: 'Crear, editar, entregar y cancelar pedidos.' },
      { permission: 'canReserveOrders', label: 'Confirmar y reservar', description: 'Aparta el stock del pedido hasta una fecha límite (máx. 15 días).' },
      { permission: 'canDeleteOrders', label: 'Eliminar pedidos', description: 'Eliminación lógica de pedidos sin factura.' },
    ],
  },
  {
    id: 'facturacion', label: 'Facturación', icon: 'fa-solid fa-file-invoice',
    actions: [{ permission: 'canInvoice', label: 'Emitir y anular facturas', description: 'Emite DTE (descuenta inventario) y anula facturas.' }],
  },
  {
    id: 'clientes', label: 'Clientes', icon: 'fa-solid fa-address-book',
    actions: [
      { permission: 'canManageCustomers', label: 'Registrar y editar clientes', description: 'Incluye el alta automática al registrar un pedido.' },
      { permission: 'canDeleteCustomers', label: 'Eliminar clientes', description: 'Quitar clientes del directorio.' },
    ],
  },
  {
    id: 'categorias', label: 'Categorías y marcas', icon: 'fa-solid fa-layer-group',
    actions: [{ permission: 'canManageTaxonomy', label: 'Gestionar categorías y marcas', description: 'Crear, editar, activar y eliminar.' }],
  },
  {
    id: 'ofertas', label: 'Ofertas', icon: 'fa-solid fa-tags',
    actions: [{ permission: 'canManageOffers', label: 'Gestionar ofertas', description: 'Crear, editar, pausar y eliminar descuentos.' }],
  },
  {
    id: 'cotizaciones', label: 'Cotizaciones', icon: 'fa-solid fa-file-invoice-dollar',
    actions: [{ permission: 'canManageQuotes', label: 'Emitir y gestionar cotizaciones', description: 'Generar, cambiar estado, convertir y eliminar.' }],
  },
  {
    id: 'interacciones', label: 'Comentarios', icon: 'fa-solid fa-comments',
    actions: [{ permission: 'canModerateReviews', label: 'Moderar comentarios', description: 'Aprobar, rechazar y eliminar opiniones del Front Office.' }],
  },
  {
    id: 'ajustes', label: 'Ajustes', icon: 'fa-solid fa-gear',
    actions: [
      { permission: 'canManageUsers', label: 'Gestionar usuarios y accesos', description: 'Cuentas, contraseñas y permisos del equipo.' },
      { permission: 'canEditSettings', label: 'Editar configuración', description: 'Canales, flujo e identidad del emisor.' },
    ],
  },
]

export const ALL_VIEWS: ViewId[] = VIEW_CATALOG.map((v) => v.id)
export const ALL_PERMISSIONS: Permission[] = VIEW_CATALOG.flatMap((v) => v.actions.map((a) => a.permission))
