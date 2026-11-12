import { STORE_CONFIG } from '@/shared/config/store.config'
import type { Invoice, InvoiceIssuer } from '../features/billing/types'

/** Emisor de las facturas de prueba (datos fiscales de fábrica). */
export const MOCK_ISSUER: InvoiceIssuer = {
  tradeName: STORE_CONFIG.name,
  legalName: STORE_CONFIG.legalName,
  nit: STORE_CONFIG.nit,
  nrc: STORE_CONFIG.nrc,
  address: STORE_CONFIG.address,
  phone: STORE_CONFIG.phones.join(' / '),
  email: STORE_CONFIG.email,
  establishmentType: STORE_CONFIG.establishmentType,
  economicActivity: STORE_CONFIG.economicActivity,
}

/**
 * Facturas de los pedidos ya entregados (ORD-2026-001 y ORD-2026-005).
 * Sus números coinciden con `MOCK_ORDER_INVOICES` en sales/mocks.
 * El stock de estas ventas ya se considera descontado en el catálogo de prueba.
 */
export const INVOICES_MOCK: Invoice[] = [
  {
    id: 'DTE-01-M001P001-000000000002076',
    generationCode: '3F1C9A2E-7B44-4D0A-9E51-6C2B8D0F4A17',
    receptionSeal: '20269C41E7B2A05D8F36C1B947E02A6D3F5B81C4',
    internalId: '015783',
    orderId: 'ORD-2026-005',
    receptor: { isFinalConsumer: false, name: 'Gabriela Solís', documentId: '03342190-5', address: 'Cantón El Carmen, Santa Cruz Michapa', email: '', phone: '7654-9812' },
    paymentCondition: 'Efectivo',
    items: [
      { productId: 'PRD-005', description: 'Mouse Inalámbrico Logitech M185', unit: 'Unidad', quantity: 1, unitPrice: 20, discount: 0 },
      { productId: 'PRD-007', description: 'Base Enfriadora de Aluminio', unit: 'Unidad', quantity: 1, unitPrice: 18, discount: 0 },
    ],
    notes: '',
    status: 'emitida',
    createdAt: '2026-11-01T22:30:00.000Z',
    createdBy: 'José Henríquez',
    issuer: MOCK_ISSUER,
    voidedAt: null,
  },
  {
    id: 'DTE-01-M001P001-000000000002075',
    generationCode: 'A8D2E6B1-0C3F-4E9A-B7D5-12F4C6E8A903',
    receptionSeal: '20264B7E1D9C03A6F28E5B4D71C0A9E3B6F2D58A',
    internalId: '015782',
    orderId: 'ORD-2026-001',
    receptor: { isFinalConsumer: true, name: 'Consumidor Final', documentId: '', address: 'Ciudad', email: '', phone: '7488-9922' },
    paymentCondition: 'Efectivo',
    items: [
      { productId: 'PRD-001', description: 'Laptop Acer Aspire 5 Refurbished', unit: 'Unidad', quantity: 1, unitPrice: 525, discount: 0 },
    ],
    notes: 'Garantía de 6 meses en equipo reacondicionado.',
    status: 'emitida',
    createdAt: '2026-11-02T15:52:00.000Z',
    createdBy: 'José Henríquez',
    issuer: MOCK_ISSUER,
    voidedAt: null,
  },
]
