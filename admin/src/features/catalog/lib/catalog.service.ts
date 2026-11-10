import { matchesQuery } from '@/shared/lib/text'
import type { BadgeTone, SelectOption } from '@/shared/ui'
import type {
  InventoryMetrics,
  Product,
  StockFilter,
  StockLevel,
  StockSeverity,
} from '../types'

/**
 * El umbral de stock crítico ya no es global: cada producto define su
 * `reorderPoint` (por defecto 3). Stock crítico = 0 < stock ≤ reorderPoint.
 */
const isLowStock = (p: Product): boolean => p.stock > 0 && p.stock <= p.reorderPoint

export { PLACEHOLDER_IMAGE } from './productImages'

export const STOCK_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Stock bajo (≤ pto. reorden)' },
  { value: 'out_of_stock', label: 'Agotados' },
  { value: 'hidden', label: 'Ocultos en Web' },
]

interface ProductQuery {
  category: string
  search: string
  stockFilter: StockFilter
}

const matchesStock = (p: Product, filter: StockFilter): boolean => {
  switch (filter) {
    case 'in_stock':
      return p.stock > 0
    case 'low_stock':
      return isLowStock(p)
    case 'out_of_stock':
      return p.stock === 0
    case 'hidden':
      return !p.active
    default:
      return true
  }
}

export function filterProducts(products: Product[], { category, search, stockFilter }: ProductQuery) {
  return products.filter((p) => {
    const matchesCategory = category === 'all' || p.category.toLowerCase() === category.toLowerCase()
    // Búsqueda unificada del sistema (varias palabras, sin tildes).
    const matchesSearch = matchesQuery([p.name, p.id, p.sku, p.brand, p.model, p.category], search)
    return matchesCategory && matchesSearch && matchesStock(p, stockFilter)
  })
}

export function getInventoryMetrics(products: Product[]): InventoryMetrics {
  return {
    total: products.length,
    active: products.filter((p) => p.active).length,
    lowStock: products.filter(isLowStock).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    totalValuation: products.reduce((acc, p) => acc + p.price * p.stock, 0),
  }
}

export const getStockSeverity = (stock: number, reorderPoint: number): StockSeverity =>
  stock === 0 ? 'out' : stock <= reorderPoint ? 'low' : 'ok'

export const getStockLevel = (stock: number, active: boolean, reorderPoint: number): StockLevel =>
  active ? getStockSeverity(stock, reorderPoint) : 'hidden'

/** Presentación del badge de existencias según el nivel. */
export function getStockBadge(stock: number, active: boolean, reorderPoint: number) {
  const badges: Record<StockLevel, { tone: BadgeTone; icon: string; label: string }> = {
    hidden: { tone: 'neutral', icon: 'fa-solid fa-eye-slash', label: 'Oculto Web' },
    out: { tone: 'danger', icon: 'fa-solid fa-circle-xmark', label: 'Agotado' },
    low: { tone: 'warning', icon: 'fa-solid fa-triangle-exclamation', label: `Stock Bajo (${stock})` },
    ok: { tone: 'success', icon: 'fa-solid fa-circle-check', label: `Disponible (${stock})` },
  }
  return badges[getStockLevel(stock, active, reorderPoint)]
}

/** Ahorro respecto al precio original, si existe. */
export function getPricing(product: Product) {
  const original = product.originalPrice ?? 0
  const hasDiscount = original > product.price
  const discountAmount = hasDiscount ? original - product.price : 0
  const discountPercent = hasDiscount ? Math.round((discountAmount / original) * 100) : 0
  return { hasDiscount, discountAmount, discountPercent, stockValue: product.price * product.stock }
}

