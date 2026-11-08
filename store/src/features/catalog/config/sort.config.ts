import type { SortBy } from '@/types'

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Menor a mayor precio' },
  { value: 'price-desc', label: 'Mayor a menor precio' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'name-asc', label: 'Nombre (A - Z)' },
]

export const CONTACT_SUBJECTS = [
  'Cotización de Laptop o Computadora',
  'Consulta sobre Componentes o Accesorios',
  'Disponibilidad en Tienda Cojutepeque',
  'Otro motivo',
]

export const TRUST_PILLARS = [
  {
    icon: 'fa-solid fa-store',
    title: 'Local Físico en Cojute',
    description: 'Frente a Dollar City, Farmacias Económicas',
    accent: 'text-brand',
    bg: 'bg-brand-50',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Garantía Real',
    description: 'Respaldo directo y soporte especializado',
    accent: 'text-brand',
    bg: 'bg-brand-50',
  },
  {
    icon: 'fa-solid fa-truck-fast',
    title: 'Envíos a Todo el País',
    description: 'Entregas departamentales seguras',
    accent: 'text-brand',
    bg: 'bg-brand-50',
  },
  {
    icon: 'fa-brands fa-whatsapp',
    title: 'Cierre vía WhatsApp',
    description: 'Atención personalizada y cotizaciones',
    accent: 'text-whatsapp',
    bg: 'bg-brand-50',
  },
]

export const FOOTER_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Ofertas del Mes', to: '/offers' },
  { label: 'Marcas Oficiales', to: '/brands' },
  { label: 'Computadoras', to: '/category/computadoras' },
  { label: 'Gaming & Periféricos', to: '/category/gaming' },
  { label: 'Sobre Nosotros', to: '/about' },
  { label: 'Contacto y Ubicación', to: '/contact' },
]
