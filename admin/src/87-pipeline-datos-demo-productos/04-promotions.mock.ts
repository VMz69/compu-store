import type { Offer } from '../features/promotions/types'

const at = '2026-10-01T09:00:00.000Z'

/** Ofertas de prueba: una vigente, una programada y una vencida (respecto a nov-2026). */
export const OFFERS_MOCK: Offer[] = [
  {
    id: 'PRM-001', title: 'Audífonos gamers 7.1', badge: 'OFERTA ESPECIAL GAMER',
    description: 'Sonido inmersivo y micrófono con cancelación de ruido.',
    productIds: ['PRD-006', 'PRD-010'], discountType: 'percent', discountValue: 15,
    startDate: '2026-11-01', endDate: '2026-11-30', paused: false, createdAt: at,
  },
  {
    id: 'PRM-002', title: 'Periféricos mecánicos RGB', badge: 'ZONA GAMING',
    description: 'Teclados mecánicos y mouses ergonómicos.',
    productIds: ['PRD-004', 'PRD-012'], discountType: 'percent', discountValue: 10,
    startDate: '2026-11-20', endDate: '2026-12-15', paused: false, createdAt: at,
  },
  {
    id: 'PRM-003', title: 'Laptops refurbished', badge: 'PRODUCTIVIDAD Y ESTUDIO',
    description: 'Equipos empresariales con garantía real.',
    productIds: ['PRD-001'], discountType: 'amount', discountValue: 25,
    startDate: '2026-10-01', endDate: '2026-10-31', paused: false, createdAt: at,
  },
]
