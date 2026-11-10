import { summarizeLines } from '@/shared/lib/pricing'
import type { Order, OrderEvent, OrderItem, OrderStatusId } from '../types'

const line = (productId: string, sku: string, name: string, unitPrice: number, quantity = 1, discountPercent = 0): OrderItem => ({
  productId, sku, name, unitPrice, quantity, discountPercent,
})

/** Historial lineal hasta `status`, a partir de la fecha de registro. */
const trail = (date: string, by: string, ...statuses: OrderStatusId[]): OrderEvent[] =>
  statuses.map((status, i) => ({ status, at: new Date(new Date(date.replace(' ', 'T')).getTime() + i * 3_600_000).toISOString(), by }))

type Seed = Omit<Order, 'total' | 'notes' | 'quoteId' | 'email'> & Partial<Pick<Order, 'notes' | 'quoteId' | 'email'>>

/**
 * Pedidos de prueba que recorren todo el flujo. Clientes del directorio
 * (customers.mock), SKUs del catálogo y facturas (billing/invoices.mock) coinciden.
 */
const SEED: Seed[] = [
  {
    id: 'ORD-2026-001', customerId: 'CLI-001', client: 'María Hernández', phone: '7488-9922', email: 'maria.hernandez@gmail.com', city: 'Cojutepeque',
    channel: 'Sala de Ventas', date: '2026-11-02 09:40', status: 'entregado', paymentMethod: 'Efectivo',
    deliveryMethod: 'Retiro en Sala de Ventas (2da Planta)', invoiceId: 'DTE-01-M001P001-000000000002075',
    items: [line('PRD-001', 'ACR-A515-REF', 'Laptop Acer Aspire 5 Refurbished', 525)],
    history: trail('2026-11-02 09:40', 'Licda. Sofía Alvarado', 'registrado', 'confirmado', 'facturado', 'entregado'),
  },
  {
    id: 'ORD-2026-002', customerId: 'CLI-002', client: 'Carlos Henríquez', phone: '6833-1100', email: 'carlos.henriquez@outlook.com', city: 'San Rafael Cedros',
    channel: 'WhatsApp', date: '2026-11-02 10:15', status: 'confirmado', paymentMethod: 'Wompi / QR',
    deliveryMethod: 'Retiro en Sala de Ventas (2da Planta)', invoiceId: null,
    items: [
      line('PRD-006', 'RDG-H510-71', 'Audífonos Gaming Diadema 7.1 Surround', 45),
      line('PRD-004', 'RDG-K552-RGB', 'Teclado Mecánico RGB Redragon Gamer', 60),
    ],
    history: trail('2026-11-02 10:15', 'Gabriela Solís', 'registrado', 'confirmado'),
  },
  {
    id: 'ORD-2026-003', customerId: 'CLI-003', client: 'Kevin Rodríguez', phone: '7012-3456', email: 'kevin.rdz@gmail.com', city: 'Cojutepeque',
    channel: 'Tienda Web', date: '2026-11-02 11:05', status: 'confirmado', paymentMethod: 'Tarjeta de Crédito',
    deliveryMethod: 'Envío local Cojutepeque', invoiceId: null,
    items: [line('PRD-003', 'SAM-980-1TB', 'Disco M.2 1 TB SAMSUNG NVMe 980', 75)],
    history: trail('2026-11-02 11:05', 'Tienda Web', 'registrado', 'confirmado'),
  },
  {
    id: 'ORD-2026-004', customerId: 'CLI-004', client: 'Empresa Consultores SV', phone: '2288-4400', email: 'compras@consultoressv.com', city: 'San Salvador',
    channel: 'Corporativo', date: '2026-11-02 11:30', status: 'registrado', paymentMethod: 'Crédito Fiscal 30 Días',
    deliveryMethod: 'Envío departamental (encomienda)', invoiceId: null, notes: 'Requiere Crédito Fiscal. Validar línea de crédito con gerencia.',
    items: [line('PRD-009', 'HP-450G8-I5', 'Laptop HP ProBook 450 G8 Core i5', 799, 2, 5)],
    history: trail('2026-11-02 11:30', 'Ing. Marvin Castro', 'registrado'),
  },
  {
    id: 'ORD-2026-005', customerId: 'CLI-005', client: 'Gabriela Solís', phone: '7654-9812', city: 'Santa Cruz Michapa',
    channel: 'WhatsApp', date: '2026-11-01 16:20', status: 'facturado', paymentMethod: 'Efectivo',
    deliveryMethod: 'Retiro en Sala de Ventas (2da Planta)', invoiceId: 'DTE-01-M001P001-000000000002076',
    items: [
      line('PRD-005', 'LOG-M185-GR', 'Mouse Inalámbrico Logitech M185', 20),
      line('PRD-007', 'RDG-CP-ALU', 'Base Enfriadora para Laptop de Aluminio', 18),
    ],
    history: trail('2026-11-01 16:20', 'Gabriela Solís', 'registrado', 'confirmado', 'facturado'),
  },
  {
    id: 'ORD-2026-006', customerId: 'CLI-007', client: 'Andrea Morales', phone: '6120-9988', email: 'andrea.morales@gmail.com', city: 'San Pedro Perulapán',
    channel: 'WhatsApp', date: '2026-11-03 15:10', status: 'cancelado', paymentMethod: 'Transferencia',
    deliveryMethod: 'Envío local Cojutepeque', invoiceId: null,
    items: [line('PRD-011', 'KNG-FB16-3200', 'Memoria RAM Kingston Fury Beast 16GB DDR4', 45, 2)],
    history: [...trail('2026-11-03 15:10', 'Gabriela Solís', 'registrado', 'cancelado').map((e) => (e.status === 'cancelado' ? { ...e, note: 'La clienta desistió: RAM incompatible con su equipo.' } : e))],
  },
]

// Más recientes primero, igual que en la vista.
export const ORDERS_MOCK: Order[] = SEED.map((o) => ({ email: '', notes: '', quoteId: null, ...o, total: summarizeLines(o.items).total }))
  .sort((a, b) => b.date.localeCompare(a.date))
