import type { ViewId } from '@/features/access'

export type NavBadgeKey = 'orders' | 'toInvoice'

export interface NavItemConfig {
  id: ViewId
  label: string
  /** Clase FontAwesome completa. */
  icon: string
  /** Contador de pendientes a mostrar como badge. */
  badge?: NavBadgeKey
}

/** Ítems del sidebar. Se filtran por `role.allowedViews`. */
export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'tablero', icon: 'fa-solid fa-border-all', label: 'Tablero' },
  { id: 'productos', icon: 'fa-solid fa-box-open', label: 'Productos' },
  { id: 'pedidos', icon: 'fa-solid fa-cart-shopping', label: 'Pedidos', badge: 'orders' },
  { id: 'facturacion', icon: 'fa-solid fa-file-invoice', label: 'Facturación', badge: 'toInvoice' },
  { id: 'clientes', icon: 'fa-solid fa-address-book', label: 'Clientes' },
  { id: 'categorias', icon: 'fa-solid fa-layer-group', label: 'Categorías' },
  { id: 'ofertas', icon: 'fa-solid fa-tags', label: 'Ofertas Web' },
  { id: 'cotizaciones', icon: 'fa-solid fa-file-invoice-dollar', label: 'Cotizaciones' },
  { id: 'interacciones', icon: 'fa-solid fa-comments', label: 'Interacciones' },
  { id: 'ajustes', icon: 'fa-solid fa-gear', label: 'Ajustes' },
]
