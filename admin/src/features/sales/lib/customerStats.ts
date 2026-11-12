import { normalizePhone, type Customer, type CustomerStats } from '@/00-director-clientes'
import type { Order } from '../types'
import { SOLD_STATUSES } from './orderFlow'

/**
 * Pedidos de un cliente: por `customerId` (enlace real). Los pedidos de
 * clientes ocasionales o anteriores al enlace se relacionan por teléfono.
 */
const belongsTo = (order: Order, customer: Customer): boolean =>
  order.customerId
    ? order.customerId === customer.id
    : normalizePhone(order.phone) !== '' && normalizePhone(order.phone) === normalizePhone(customer.phone)

export function getCustomerOrderStats(customer: Customer, orders: Order[]): CustomerStats {
  const own = orders.filter((o) => belongsTo(o, customer))
  return {
    orderCount: own.length,
    totalSpent: own.filter((o) => SOLD_STATUSES.includes(o.status)).reduce((acc, o) => acc + o.total, 0),
    lastOrderDate: own.reduce<string | null>((latest, o) => (!latest || o.date > latest ? o.date : latest), null),
  }
}
