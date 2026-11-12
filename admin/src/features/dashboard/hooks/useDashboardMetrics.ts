import { useNavigate } from 'react-router-dom'
import { useInventoryMetrics, useProductActions } from '@/00-director-catalogo'
import { useOrderActions, useOrderMetrics, useRecentOrders } from '@/00-director-ventas'
import { useStoreSettings } from '@/00-director-ajustes'
import { formatCurrency } from '@/shared/lib/currency'
import { percent } from '@/shared/lib/text'
import type { KpiData, ProgressTone } from '@/00-director-interfaz'

type KpiItem = KpiData & { id: string }

/** Métricas ejecutivas, órdenes recientes y accesos rápidos del Tablero. */
export function useDashboardMetrics() {
  const navigate = useNavigate()
  const settings = useStoreSettings()
  const inv = useInventoryMetrics()
  const ord = useOrderMetrics()
  const recentOrders = useRecentOrders(4)
  const productActions = useProductActions()
  const orderActions = useOrderActions()

  const healthy = inv.total - inv.lowStock - inv.outOfStock

  const kpis: KpiItem[] = [
    {
      id: 'revenue', label: 'Ventas Cobradas', value: formatCurrency(ord.revenue),
      hint: `${ord.invoiced + ord.delivered} pedidos facturados`, hintIcon: 'fa-solid fa-arrow-trend-up', hintTone: 'success',
      icon: 'fa-solid fa-cash-register', iconTone: 'success',
    },
    {
      id: 'active-orders', label: 'Pedidos Activos', value: String(ord.active),
      hint: `${ord.registered} por confirmar · ${ord.confirmed} listos · ${ord.invoiced} por entregar`, hintIcon: 'fa-solid fa-clock', hintTone: 'warning',
      icon: 'fa-solid fa-truck-ramp-box', iconTone: 'warning',
    },
    {
      id: 'catalog', label: 'Catálogo Web', value: `${inv.active} / ${inv.total}`,
      hint: `${formatCurrency(inv.totalValuation)} en stock`, hintIcon: 'fa-solid fa-boxes-stacked', hintTone: 'brand',
      icon: 'fa-solid fa-box', iconTone: 'brand',
    },
    {
      id: 'stock-alerts', label: 'Alertas de Stock', value: String(inv.lowStock + inv.outOfStock),
      hint: `${inv.outOfStock} agotados, ${inv.lowStock} críticos`, hintIcon: 'fa-solid fa-triangle-exclamation',
      hintTone: inv.outOfStock > 0 ? 'danger' : 'muted', icon: 'fa-solid fa-bell', iconTone: 'danger',
    },
  ]

  const health: Array<{ label: string; value: number; tone: ProgressTone }> = [
    { label: 'Disponibilidad Saludable', value: percent(healthy, inv.total), tone: 'success' },
    { label: 'Stock Crítico (≤ pto. de reorden)', value: percent(inv.lowStock, inv.total), tone: 'warning' },
    { label: 'Agotados', value: percent(inv.outOfStock, inv.total), tone: 'danger' },
  ]

  return {
    branch: { title: `${settings.name} · Sucursal Cojutepeque`, address: settings.address, schedule: settings.schedule },
    kpis,
    health,
    recentOrders,
    canCreateProduct: productActions.permissions.canCreate,
    canRegisterOrder: orderActions.canChangeStatus,
    createProduct: productActions.openCreate,
    registerOrder: orderActions.openCreate,
    goTo: (path: string) => navigate(path),
    seeAllOrders: () => navigate('/pedidos'),
  }
}
