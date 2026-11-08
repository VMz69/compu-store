import type { Promotion } from '../types'

/** Campañas sincronizadas con los banners del Front Office. */
export const PROMOTIONS_MOCK: Promotion[] = [
  {
    id: 'PRM-001',
    title: 'AUDÍFONOS GAMERS 7.1',
    badge: 'OFERTA ESPECIAL GAMER',
    discountText: '20% DESCUENTO',
    targetCategory: 'audio',
    active: true,
    description: 'Sonido inmersivo y micrófono con cancelación de ruido.',
  },
  {
    id: 'PRM-002',
    title: 'LAPTOPS REFURBISHED',
    badge: 'PRODUCTIVIDAD Y ESTUDIO',
    discountText: 'DESDE $525.00',
    targetCategory: 'computadoras',
    active: true,
    description: 'Equipos empresariales con procesadores Core i5 y garantía real.',
  },
  {
    id: 'PRM-003',
    title: 'PERIFÉRICOS MECÁNICOS RGB',
    badge: 'ZONA GAMING & STREAMING',
    discountText: 'HASTA 15% OFF',
    targetCategory: 'gaming',
    active: true,
    description: 'Teclados mecánicos Outemu Blue y mouses ergonómicos.',
  },
]
