import type { Channel } from '../42-pipeline-persistencia-pedidos/05-types'

/** Canales omnicanal de venta. */
export const CHANNELS_MOCK: Channel[] = [
  {
    id: 'sala-ventas',
    name: 'Sala de Ventas',
    badge: 'Presencial',
    icon: 'fa-solid fa-store',
    color: 'emerald',
    description:
      'Ventas y cotizaciones directas en sucursal Cojutepeque (2da planta frente a Dollar City).',
    active: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    badge: 'Chat & Call',
    icon: 'fa-brands fa-whatsapp',
    color: 'green',
    description: 'Ventas coordinadas mediante el canal comercial 7038-8225.',
    active: true,
  },
  {
    id: 'tienda-web',
    name: 'Tienda Web',
    badge: 'Front Office',
    icon: 'fa-solid fa-globe',
    color: 'blue',
    description: 'Órdenes originadas desde el catálogo web digital sincronizado.',
    active: true,
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    badge: 'Crédito Fiscal',
    icon: 'fa-solid fa-briefcase',
    color: 'purple',
    description: 'Ventas B2B para colegios, despachos jurídicos, empresas e instituciones.',
    active: true,
  },
]
