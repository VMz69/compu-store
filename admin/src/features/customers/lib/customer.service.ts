import type { Order } from '@/features/sales'
import type { Customer, CustomerStats, CustomerStatusFilter, CustomerType } from '../types'

/**
 * Lógica pura del directorio de clientes (sin React ni store).
 */

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  persona: 'Persona',
  empresa: 'Empresa',
}

/** Solo dígitos: "7488-9922" y "74889922" se consideran el mismo teléfono. */
export const normalizePhone = (phone: string): string => phone.replace(/\D/g, '')

interface CustomerQuery {
  search: string
  type: 'all' | CustomerType
  status: CustomerStatusFilter
}

export function filterCustomers(customers: Customer[], { search, type, status }: CustomerQuery): Customer[] {
  const term = search.trim().toLowerCase()
  const digits = normalizePhone(search)
  return customers.filter((c) => {
    if (type !== 'all' && c.type !== type) return false
    if (status === 'active' && !c.active) return false
    if (status === 'inactive' && c.active) return false
    if (!term) return true
    return (
      [c.name, c.email, c.city, c.documentId, c.id].some((f) => f.toLowerCase().includes(term)) ||
      (digits.length >= 3 && normalizePhone(c.phone).includes(digits))
    )
  })
}

/**
 * Pedidos de un cliente. Mientras los pedidos no guarden `customerId`, se
 * relacionan por teléfono (prioritario) o por nombre exacto.
 * TODO(API): reemplazar por `order.customerId === customer.id`.
 */
const belongsTo = (order: Order, customer: Customer): boolean =>
  normalizePhone(order.phone) === normalizePhone(customer.phone) ||
  order.client.trim().toLowerCase() === customer.name.trim().toLowerCase()

export function getCustomerStats(customer: Customer, orders: Order[]): CustomerStats {
  const own = orders.filter((o) => belongsTo(o, customer))
  return {
    orderCount: own.length,
    totalSpent: own.filter((o) => o.status === 'Entregado').reduce((acc, o) => acc + o.total, 0),
    lastOrderDate: own.reduce<string | null>((latest, o) => (!latest || o.date > latest ? o.date : latest), null),
  }
}

/* ------------------------------------------------------------------ */
/* Validación                                                          */
/* ------------------------------------------------------------------ */

const PHONE_PATTERN = /^[0-9+\-\s]{8,15}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** DUI salvadoreño: 8 dígitos, guion, 1 dígito verificador. */
const DUI_PATTERN = /^\d{8}-\d$/
/** NIT salvadoreño: 0000-000000-000-0. */
const NIT_PATTERN = /^\d{4}-\d{6}-\d{3}-\d$/

export interface CustomerFormFields {
  id: string
  type: string
  name: string
  documentId: string
  phone: string
  email: string
}

export function validateCustomer(v: CustomerFormFields, customers: Customer[]): Record<string, string> {
  const e: Record<string, string> = {}
  if (v.name.trim().length < 3) {
    e.name = v.type === 'empresa' ? 'Ingresa la razón social.' : 'Ingresa el nombre completo.'
  }
  if (!PHONE_PATTERN.test(v.phone.trim())) e.phone = 'Teléfono obligatorio (ej. 7038-8225).'
  else if (customers.some((c) => c.id !== v.id && normalizePhone(c.phone) === normalizePhone(v.phone))) {
    e.phone = 'Ya hay un cliente con este teléfono.'
  }
  if (v.email.trim() && !EMAIL_PATTERN.test(v.email.trim())) e.email = 'Correo no válido.'
  const doc = v.documentId.trim()
  if (doc) {
    const valid = v.type === 'empresa' ? NIT_PATTERN.test(doc) : DUI_PATTERN.test(doc)
    if (!valid) e.documentId = v.type === 'empresa' ? 'Formato NIT: 0614-250318-102-3' : 'Formato DUI: 01234567-8'
  }
  return e
}
