import { SegmentedTabs } from '@/00-director-interfaz'
import { useOrderStatusTabs } from './00-director-consulta-pedidos'

/** Filtro por estado del pedido (patrón segmentado del sistema) con conteo por estado. */
export function OrderStatusTabs({ className }: { className?: string }) {
  const { tabs, active, select } = useOrderStatusTabs()

  return <SegmentedTabs items={tabs} value={active} onChange={select} aria-label="Filtrar pedidos por estado" traceId="sales.tabs" className={className} />
}
