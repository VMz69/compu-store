import type { Order } from '../types'

/** Facturas de prueba ya emitidas (billing/mocks/invoices.mock.ts). */
export const MOCK_ORDER_INVOICES: Record<string, string> = {
  'ORD-2026-001': 'DTE-01-M001P001-000000000002075',
  'ORD-2026-005': 'DTE-01-M001P001-000000000002076',
}

/** Pedidos operacionales con flujo completo. */
const SEED: Omit<Order, 'invoiceId'>[] = [
  {
    id: 'ORD-2026-001',
    client: 'María Hernández',
    phone: '7488-9922',
    city: 'Cojutepeque',
    channel: 'Sala de Ventas',
    date: '2026-11-02 09:40',
    total: 525.0,
    status: 'Entregado',
    paymentMethod: 'Efectivo / Transferencia',
    deliveryMethod: 'Retiro en Sala de Ventas (2da Planta)',
    items: [{ productId: 'PRD-001', name: 'Laptop Acer Aspire 5 Refurbished', quantity: 1, price: 525.0 }],
  },
  {
    id: 'ORD-2026-002',
    client: 'Carlos Henríquez',
    phone: '6833-1100',
    city: 'San Rafael Cedros',
    channel: 'WhatsApp',
    date: '2026-11-02 10:15',
    total: 105.0,
    status: 'Listo para Retiro',
    paymentMethod: 'Wompi / Tarjeta',
    deliveryMethod: 'Retiro en Tienda Cojutepeque',
    items: [
      { productId: 'PRD-006', name: 'Audífonos Gaming Diadema 7.1', quantity: 1, price: 45.0 },
      { productId: 'PRD-004', name: 'Teclado Mecánico RGB Redragon', quantity: 1, price: 60.0 },
    ],
  },
  {
    id: 'ORD-2026-003',
    client: 'Kevin Rodríguez',
    phone: '7012-3456',
    city: 'Cojutepeque',
    channel: 'Tienda Web',
    date: '2026-11-02 11:05',
    total: 75.0,
    status: 'Confirmado',
    paymentMethod: 'Tarjeta de Crédito',
    deliveryMethod: 'Retiro en Sala de Ventas',
    items: [{ productId: 'PRD-003', name: 'Disco M.2 1 TB SAMSUNG NVMe', quantity: 1, price: 75.0 }],
  },
  {
    id: 'ORD-2026-004',
    client: 'Empresa Consultores SV',
    phone: '2288-4400',
    city: 'San Salvador',
    channel: 'Corporativo',
    date: '2026-11-02 11:30',
    total: 1598.0,
    status: 'Pendiente',
    paymentMethod: 'Crédito Fiscal 30 Días',
    deliveryMethod: 'Envío Departamental Especializado',
    items: [{ productId: 'PRD-009', name: 'Laptop HP ProBook 450 G8 Core i5', quantity: 2, price: 799.0 }],
  },
  {
    id: 'ORD-2026-005',
    client: 'Gabriela Solís',
    phone: '7654-9812',
    city: 'Santa Cruz Michapa',
    channel: 'WhatsApp',
    date: '2026-11-01 16:20',
    total: 38.0,
    status: 'Entregado',
    paymentMethod: 'Efectivo',
    deliveryMethod: 'Retiro en Tienda Cojutepeque',
    items: [
      { productId: 'PRD-005', name: 'Mouse Inalámbrico Logitech M185', quantity: 1, price: 20.0 },
      { productId: 'PRD-007', name: 'Base Enfriadora de Aluminio', quantity: 1, price: 18.0 },
    ],
  },
]

export const ORDERS_MOCK: Order[] = SEED.map((o) => ({ ...o, invoiceId: MOCK_ORDER_INVOICES[o.id] ?? null }))
