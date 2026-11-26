import { STORE_CONFIG, getStoreCityName } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'

/** Se evalúa después de la precarga (main.tsx importa la app al tener la identidad). */
export const TRUST_PILLARS = [
  {
    icon: 'fa-solid fa-store',
    title: `Local Físico en ${getStoreCityName()}`,
    description: STORE_CONFIG.addressShort,
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
