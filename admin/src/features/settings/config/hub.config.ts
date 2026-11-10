/** Tarjetas activas del hub. Las desactivadas viven en `hub.future.ts` (ver ESCALABILIDAD.md). */
export type HubCardId = 'canales' | 'usuarios' | 'identidad'

/** Contenido estático de las tarjetas del hub de Ajustes (las métricas las aporta el hook). */
export interface HubCardConfig {
  id: HubCardId
  to: string
  icon: string
  /** Clases completas del contenedor del ícono. */
  iconClass: string
  badge: string
  /** Clases completas de la insignia. */
  badgeClass: string
  title: string
  description: string
  cta: string
  /** Tarjeta destacada (borde de marca + CTA primario). */
  featured?: boolean
  /**
   * Columnas que ocupa en la cuadrícula (md: 2 · xl: 3). Clases completas para Tailwind.
   * Con 3 tarjetas: una fila de 3 en xl; en md la tercera ocupa la fila completa.
   */
  spanClass: string
}

export const HUB_CARDS: HubCardConfig[] = [
  {
    id: 'canales',
    to: '/ajustes/canales',
    icon: 'fa-solid fa-diagram-project',
    iconClass: 'bg-brand/10 text-brand',
    badge: 'Flujo de Pedidos',
    badgeClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    title: 'Canales & Transiciones Operativas',
    description:
      'Canales omnicanal (WhatsApp, Tienda Web, Sala de Ventas, Corporativo) y flujo general de pedidos: Registrado → Confirmado y Listo → Facturado → Entregado.',
    cta: 'Administrar Canales y Flujos',
    featured: true,
    spanClass: '',
  },
  {
    id: 'usuarios',
    to: '/ajustes/usuarios',
    icon: 'fa-solid fa-users-gear',
    iconClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300',
    badge: 'Seguridad',
    badgeClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    title: 'Usuarios y Roles',
    description:
      'Cuentas del equipo, contraseñas, activación de accesos y matriz de permisos por rol (RBAC).',
    cta: 'Gestionar Usuarios',
    spanClass: '',
  },
  {
    id: 'identidad',
    to: '/ajustes/identidad',
    icon: 'fa-solid fa-building',
    iconClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    badge: 'Sucursal',
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    title: 'Identidad del Emisor',
    description:
      'Datos del emisor en cotizaciones y facturas: nombre comercial, contacto, dirección, razón social, NIT, NRC y giro.',
    cta: 'Editar datos del emisor',
    spanClass: 'md:col-span-2 xl:col-span-1',
  },
]
