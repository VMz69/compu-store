/** Persona natural (DUI) o empresa (NIT, suele requerir Crédito Fiscal). */
export type CustomerType = 'persona' | 'empresa'

export interface Customer {
  /** Id interno (ej. "CLI-001"). */
  id: string
  type: CustomerType
  /** Nombre completo o razón social. */
  name: string
  /** DUI (personas) o NIT (empresas). Opcional. */
  documentId: string
  phone: string
  email: string
  /** Municipio / ciudad. */
  city: string
  address: string
  /** Notas internas del equipo (preferencias, acuerdos, etc.). */
  notes: string
  /** Un cliente inactivo se conserva por historial, pero no se ofrece en nuevos pedidos. */
  active: boolean
  /** Fecha ISO de registro. */
  createdAt: string
}

/** Datos editables. Sin `id` se crea un cliente nuevo. */
export type CustomerDraft = Omit<Customer, 'id' | 'createdAt'> & { id?: string }

export type CustomerStatusFilter = 'all' | 'active' | 'inactive'

/** Métricas de compra derivadas de los pedidos (no se guardan: se calculan). */
export interface CustomerStats {
  orderCount: number
  /** Total facturado de pedidos entregados. */
  totalSpent: number
  /** Fecha del último pedido ("YYYY-MM-DD HH:mm") o null. */
  lastOrderDate: string | null
}
