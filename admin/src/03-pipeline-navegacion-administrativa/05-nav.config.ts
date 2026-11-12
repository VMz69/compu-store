import { VIEW_CATALOG, type ViewId } from '@/00-director-acceso'

export type NavBadgeKey = 'orders' | 'toInvoice' | 'reviews'

export interface NavItemConfig {
  id: ViewId
  label: string
  /** Clase FontAwesome completa. */
  icon: string
  /** Contador de pendientes a mostrar como badge. */
  badge?: NavBadgeKey
  /** "topbar": no va en el sidebar; tiene acceso directo en la barra superior (ej. Ajustes). */
  placement: 'main' | 'topbar'
}

/** Contadores por vista (lo propio del menú; nombre e ícono vienen del catálogo de vistas). */
const BADGES: Partial<Record<ViewId, NavBadgeKey>> = {
  pedidos: 'orders',
  facturacion: 'toInvoice',
  interacciones: 'reviews',
}

/** Vistas fuera del sidebar, con acceso directo en la barra superior (configuración, no operación diaria). */
const TOPBAR: ViewId[] = ['ajustes']

/**
 * Ítems del sidebar, en el orden del catálogo de vistas de Accesos (única fuente).
 * Se filtran por las vistas habilitadas del usuario (`role.allowedViews`).
 */
export const NAV_ITEMS: NavItemConfig[] = VIEW_CATALOG.map(({ id, label, icon }) => ({
  id, label, icon, badge: BADGES[id], placement: TOPBAR.includes(id) ? 'topbar' : 'main',
}))
