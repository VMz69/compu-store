import type { Customer } from '../33-pipeline-historial-clientes/03-types'

/**
 * Directorio inicial. Los nombres y teléfonos coinciden con los pedidos de
 * prueba para que las métricas de compra salgan con datos reales.
 */
export const CUSTOMERS_MOCK: Customer[] = [
  {
    id: 'CLI-001', type: 'persona', name: 'María Hernández', documentId: '04512378-9',
    phone: '7488-9922', email: 'maria.hernandez@gmail.com', city: 'Cojutepeque',
    address: 'Barrio El Centro, 3a Calle Poniente #12', notes: 'Prefiere retirar en sala de ventas.',
    active: true, createdAt: '2026-06-14T15:20:00.000Z',
  },
  {
    id: 'CLI-002', type: 'persona', name: 'Carlos Henríquez', documentId: '05873421-0',
    phone: '6833-1100', email: 'carlos.henriquez@outlook.com', city: 'San Rafael Cedros',
    address: 'Colonia Las Flores, pasaje 4', notes: 'Cliente gamer; avisar nuevas ofertas de periféricos.',
    active: true, createdAt: '2026-07-02T10:00:00.000Z',
  },
  {
    id: 'CLI-003', type: 'persona', name: 'Kevin Rodríguez', documentId: '',
    phone: '7012-3456', email: 'kevin.rdz@gmail.com', city: 'Cojutepeque',
    address: '', notes: '', active: true, createdAt: '2026-09-19T18:45:00.000Z',
  },
  {
    id: 'CLI-004', type: 'empresa', name: 'Empresa Consultores SV', documentId: '0614-250318-102-3',
    phone: '2288-4400', email: 'compras@consultoressv.com', city: 'San Salvador',
    address: 'Edificio Torre Futura, nivel 9, Colonia Escalón', notes: 'Crédito fiscal a 30 días. Contacto: Lic. Ana Rivas.',
    active: true, createdAt: '2026-03-08T09:00:00.000Z',
  },
  {
    id: 'CLI-005', type: 'persona', name: 'Gabriela Solís', documentId: '03342190-5',
    phone: '7654-9812', email: '', city: 'Santa Cruz Michapa',
    address: 'Cantón El Carmen', notes: '', active: true, createdAt: '2026-08-21T14:10:00.000Z',
  },
  {
    id: 'CLI-006', type: 'empresa', name: 'Despacho Jurídico Portillo & Asociados', documentId: '0702-110520-101-7',
    phone: '7845-1290', email: 'rportillo@portilloabogados.sv', city: 'Cojutepeque',
    address: '2a Avenida Norte #8', notes: 'Cotizando 3 laptops HP ProBook con CCF.',
    active: true, createdAt: '2026-11-04T13:30:00.000Z',
  },
  {
    id: 'CLI-007', type: 'persona', name: 'Andrea Morales', documentId: '',
    phone: '6120-9988', email: 'andrea.morales@gmail.com', city: 'San Pedro Perulapán',
    address: '', notes: 'Consultó compatibilidad de RAM para Dell Inspiron.', active: true,
    createdAt: '2026-11-04T12:05:00.000Z',
  },
  {
    id: 'CLI-008', type: 'persona', name: 'Mauricio Gómez', documentId: '',
    phone: '7233-4411', email: '', city: 'Cojutepeque',
    address: '', notes: '', active: false, createdAt: '2026-05-30T16:00:00.000Z',
  },
]
