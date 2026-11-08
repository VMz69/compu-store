import { useMemo } from 'react'
import { getInventoryMetrics } from '../lib/catalog.service'
import { useCatalogStore } from '../store'

export function useInventoryMetrics() {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => getInventoryMetrics(products), [products])
}

/** Productos con existencias (para el formulario de pedidos). */
export function useInStockProducts() {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => products.filter((p) => p.stock > 0), [products])
}
