import { Badge } from '@/shared/ui'
import { getStockBadge } from '../lib/catalog.service'

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
