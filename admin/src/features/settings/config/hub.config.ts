/** Contenido estático de las tarjetas del hub de Ajustes (las métricas las aporta el hook). */
export interface HubCardConfig {
  id: 'canales' | 'usuarios' | 'identidad' | 'parametros' | 'mantenimiento'
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
      'Control de canales omnicanal (WhatsApp, Tienda Web, Sala de Ventas, Corporativo) y del ciclo secuencial de estados por los que avanza cada orden.',
    cta: 'Administrar Canales y Flujos',
    featured: true,
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
  },
  {
    id: 'identidad',
    to: '/ajustes/identidad',
    icon: 'fa-solid fa-building',
    iconClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    badge: 'Sucursal',
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    title: 'Identidad Comercial & Sucursal',
    description:
      'Razón comercial, correo institucional, teléfonos de atención en sala y dirección física en Cojutepeque.',
    cta: 'Gestionar Identidad',
  },
  {
    id: 'parametros',
    to: '/ajustes/parametros',
    icon: 'fa-solid fa-scale-balanced',
    iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    badge: 'Normativa SV',
    badgeClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    title: 'Parámetros Fiscales & Moneda',
    description:
      'Moneda de curso legal (USD), alícuota del 13% de IVA según normativa salvadoreña y emisión de DTE / CCF.',
    cta: 'Ver Parámetros Fiscales',
  },
  {
    id: 'mantenimiento',
    to: '/ajustes/mantenimiento',
    icon: 'fa-solid fa-database',
    iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    badge: 'Datos & Memoria',
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    title: 'Mantenimiento & Respaldos',
    description:
      'Exportar snapshot integral JSON, monitoreo del almacenamiento local y restauración de fábrica del demo.',
    cta: 'Herramientas de Mantenimiento',
  },
]
