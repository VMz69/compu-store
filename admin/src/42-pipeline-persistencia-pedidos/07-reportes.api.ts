import type { CustomerStats } from '@/00-director-clientes'
import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import { nowStamp } from './02-order.service'
import type { OrderMetrics } from './05-types'

/**
 * Adaptador de reportes (L18): `/admin/reportes/tablero` → `OrderMetrics` y `/admin/reportes/clientes`
 * → `CustomerStats` por `CLI-###` (D-14, D-19). El servidor cuenta, une por cliente o teléfono y suma en
 * DECIMAL sobre los pedidos vigentes; aquí solo se traduce.
 */

interface TableroDto {
  pedidos: {
    total: number
    registrados: number
    confirmados: number
    facturados: number
    entregados: number
    cancelados: number
    activos: number
    ventas: string
  }
}

interface EstadisticaClienteDto {
  clienteId: number
  pedidos: number
  totalComprado: string
  ultimoPedido: string | null
}

type Envelope<T> = { data: T }
type PagedEnvelope<T> = { data: T[]; meta: { page: number; totalPages: number } }

const customerId = (id: number) => `CLI-${String(id).padStart(3, '0')}`

export async function fetchOrderMetrics(): Promise<OrderMetrics> {
  const { data } = await apiClient.get<Envelope<TableroDto>>('/admin/reportes/tablero')
  const p = data.data.pedidos
  return {
    total: p.total,
    registered: p.registrados,
    confirmed: p.confirmados,
    invoiced: p.facturados,
    delivered: p.entregados,
    cancelled: p.cancelados,
    active: p.activos,
    revenue: Number(p.ventas),
  }
}

/** Historial de compra de todo el directorio (todas las páginas), por id del admin. */
export async function fetchCustomerStats(): Promise<Record<string, CustomerStats>> {
  const stats: Record<string, CustomerStats> = {}
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<EstadisticaClienteDto>>('/admin/reportes/clientes', { params: { limit: 100, page } })
    for (const e of data.data) {
      stats[customerId(e.clienteId)] = {
        orderCount: e.pedidos,
        totalSpent: Number(e.totalComprado),
        // Mismo formato que la fecha del pedido ("YYYY-MM-DD HH:mm", hora local).
        lastOrderDate: e.ultimoPedido ? nowStamp(new Date(e.ultimoPedido)) : null,
      }
    }
    if (page >= data.meta.totalPages) return stats
  }
}
