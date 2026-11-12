import { Badge } from '@/00-director-interfaz'
import { getStockBadge } from '../25-pipeline-persistencia-catalogo/02-catalog.service'

interface StockBadgeProps {
  stock: number
  active: boolean
  /** Punto de reorden del producto (umbral de stock crítico). */
  reorderPoint: number
}

export function StockBadge({ stock, active, reorderPoint }: StockBadgeProps) {
  const { tone, icon, label } = getStockBadge(stock, active, reorderPoint)
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  )
}
