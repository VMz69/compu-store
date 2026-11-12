import { STORE_CONFIG } from '@/85-pipeline-identificadores-texto/03-store.config'
import type { Quote, QuoteCustomer, QuoteItem } from '../51-pipeline-persistencia-cotizaciones/03-types'

/** Emisor por defecto de las cotizaciones de prueba. */
const ISSUER = {
  name: STORE_CONFIG.name,
  address: STORE_CONFIG.address,
  phones: STORE_CONFIG.phones,
  email: STORE_CONFIG.email,
  taxRate: STORE_CONFIG.taxRate,
}

const item = (productId: string, sku: string, name: string, unitPrice: number, quantity: number, discountPercent = 0): QuoteItem => ({
  productId, sku, name, unitPrice, quantity, discountPercent,
})

const fromDirectory = (customerId: string, name: string, phone: string, email = '', documentId = ''): QuoteCustomer => ({
  customerId, name, phone, email, documentId,
})

/**
 * Cotizaciones de prueba. Clientes y productos existen en sus respectivos
 * mocks; las fechas cubren todos los estados (incluida una vencida).
 */
const SEED: (Omit<Quote, 'charges'> & Partial<Pick<Quote, 'charges'>>)[] = [
  {
    id: 'COT-2026-006',
    customer: fromDirectory('CLI-006', 'Despacho Jurídico Portillo & Asociados', '7845-1290', 'rportillo@portilloabogados.sv', '0702-110520-101-7'),
    charges: [{ id: 'CHG-1', concept: 'Configuración e instalación en oficina', amount: 30 }],
    items: [
      item('PRD-009', 'HP-450G8-I5', 'Laptop HP ProBook 450 G8 Core i5', 799, 3, 5),
      item('PRD-005', 'LOG-M185-GR', 'Mouse Inalámbrico Logitech M185', 20, 3),
    ],
    notes: 'Requiere Crédito Fiscal (CCF). Retiro programado para el jueves.',
    validityDays: 15, status: 'emitida', createdAt: '2026-11-04T14:10:00.000Z', createdBy: 'Gabriela Solís', issuer: ISSUER,
  },
  {
    id: 'COT-2026-005',
    customer: fromDirectory('CLI-004', 'Empresa Consultores SV', '2288-4400', 'compras@consultoressv.com', '0614-250318-102-3'),
    items: [
      item('PRD-002', 'DEL-SE2422H', 'Monitor Dell 24 pulg. IPS FHD 75Hz', 250, 4, 8),
      item('PRD-011', 'KNG-FB16-3200', 'Memoria RAM Kingston Fury Beast 16GB DDR4', 45, 4),
    ],
    notes: 'Crédito fiscal a 30 días según acuerdo comercial.',
    validityDays: 30, status: 'aceptada', createdAt: '2026-10-28T10:30:00.000Z', createdBy: 'Licda. Sofía Alvarado', issuer: ISSUER,
  },
  {
    id: 'COT-2026-004',
    customer: fromDirectory('CLI-002', 'Carlos Henríquez', '6833-1100', 'carlos.henriquez@outlook.com'),
    items: [
      item('PRD-012', 'RDG-GC-RECL', 'Silla Gamer Ergonómica Reclinable', 185, 1),
      item('PRD-004', 'RDG-K552-RGB', 'Teclado Mecánico RGB Redragon Gamer', 60, 1),
      item('PRD-006', 'RDG-H510-71', 'Audífonos Gaming Diadema 7.1 Surround', 45, 1),
    ],
    notes: 'Combo gamer. Consultar disponibilidad de silla en sala.',
    validityDays: 7, status: 'emitida', createdAt: '2026-11-02T16:45:00.000Z', createdBy: 'Gabriela Solís', issuer: ISSUER,
  },
  {
    id: 'COT-2026-003',
    customer: { customerId: null, name: 'Colegio San José de Cojutepeque', phone: '2372-5500', email: 'administracion@csj.edu.sv', documentId: '' },
    items: [item('PRD-001', 'ACR-A515-REF', 'Laptop Acer Aspire 5 Refurbished', 525, 10, 10)],
    notes: 'Cotización para laboratorio de cómputo. Pago contra entrega.',
    validityDays: 15, status: 'rechazada', createdAt: '2026-10-15T09:00:00.000Z', createdBy: 'Ing. Marvin Castro', issuer: ISSUER,
  },
  {
    id: 'COT-2026-002',
    customer: fromDirectory('CLI-007', 'Andrea Morales', '6120-9988', 'andrea.morales@gmail.com'),
    items: [item('PRD-011', 'KNG-FB16-3200', 'Memoria RAM Kingston Fury Beast 16GB DDR4', 45, 2)],
    notes: '',
    validityDays: 7, status: 'emitida', createdAt: '2026-10-20T11:20:00.000Z', createdBy: 'Gabriela Solís', issuer: ISSUER,
  },
  {
    id: 'COT-2026-001',
    customer: fromDirectory('CLI-001', 'María Hernández', '7488-9922', 'maria.hernandez@gmail.com', '04512378-9'),
    items: [
      item('PRD-003', 'SAM-980-1TB', 'Disco M.2 1 TB SAMSUNG NVMe 980', 75, 1),
      item('PRD-007', 'RDG-CP-ALU', 'Base Enfriadora para Laptop de Aluminio', 18, 1),
    ],
    notes: '',
    validityDays: 15, status: 'aceptada', createdAt: '2026-10-05T15:00:00.000Z', createdBy: 'Licda. Sofía Alvarado', issuer: ISSUER,
  },
]

export const QUOTES_MOCK: Quote[] = SEED.map((q) => ({ ...q, charges: q.charges ?? [] }))
