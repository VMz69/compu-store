import { useMemo } from 'react'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'
import type { InventoryMetrics } from '../25-pipeline-persistencia-catalogo/04-types'

/** Sin datos aún (antes de la primera lectura de la API). */
const NO_METRICS: InventoryMetrics = { total: 0, active: 0, lowStock: 0, outOfStock: 0, totalValuation: 0 }

/** Métricas de inventario calculadas por la API (L06, GET /admin/inventario/metricas). */
export function useInventoryMetrics(): InventoryMetrics {
  return useCatalogStore((s) => s.inventoryMetrics) ?? NO_METRICS
}

/** Productos con existencias (para el formulario de pedidos). */
export function useInStockProducts() {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => products.filter((p) => p.stock > 0), [products])
}
