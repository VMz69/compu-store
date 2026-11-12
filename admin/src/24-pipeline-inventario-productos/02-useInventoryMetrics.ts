import { useMemo } from 'react'
import { getInventoryMetrics } from '../25-pipeline-persistencia-catalogo/02-catalog.service'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'

export function useInventoryMetrics() {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => getInventoryMetrics(products), [products])
}

/** Productos con existencias (para el formulario de pedidos). */
export function useInStockProducts() {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => products.filter((p) => p.stock > 0), [products])
}
