import type { OrderStatus } from '../types'

/** Pipeline operativo de pedidos (transiciones permitidas por estado). */
export const STATUSES_MOCK: OrderStatus[] = [
  {
    id: 'Pendiente',
    name: 'Pendiente',
    step: 1,
    icon: 'fa-clock',
    color: 'amber',
    badgeStyle:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    description:
      'Orden recibida; pendiente de confirmación de pago o validación física en bodega.',
    nextPossible: ['Confirmado', 'Cancelado'],
  },
  {
    id: 'Confirmado',
    name: 'Confirmado',
    step: 2,
    icon: 'fa-thumbs-up',
    color: 'blue',
    badgeStyle:
      'bg-blue-50 text-brand border-brand/30 dark:bg-brand-950/50 dark:text-blue-300 dark:border-brand-800',
    description:
      'Pago o crédito validado; orden enviada al área técnica para empaquetado y emisión de CCF o factura.',
    nextPossible: ['Listo para Retiro', 'Cancelado'],
  },
  {
    id: 'Listo para Retiro',
    name: 'Listo para Retiro',
    step: 3,
    icon: 'fa-box-open',
    color: 'purple',
    badgeStyle:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description:
      'Paquete embalado y verificado listo en mostrador de Cojutepeque o en espera de recolección de transporte.',
    nextPossible: ['Entregado', 'Cancelado'],
  },
  {
    id: 'Entregado',
    name: 'Entregado',
    step: 4,
    icon: 'fa-circle-check',
    color: 'emerald',
    badgeStyle:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    description:
      'Mercadería recibida a conformidad por el cliente. Transacción liquidada y archivada.',
    nextPossible: [],
  },
  {
    id: 'Cancelado',
    name: 'Cancelado',
    step: 0,
    icon: 'fa-ban',
    color: 'red',
    badgeStyle:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
    description:
      'Orden anulada por solicitud del cliente, falta de pago o inconsistencia en inventario.',
    nextPossible: [],
  },
]
