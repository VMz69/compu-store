export type ProductCondition = 'nuevo' | 'usado' | 'reacondicionado'

/** Especificación técnica clave/valor (ej. "Procesador" → "Intel Core i5"). */
export interface ProductSpec {
  key: string
  value: string
}

/** Lote físico de inventario con trazabilidad de vencimiento. */
export interface ProductLot {
  id: string
  lotNumber: string
  quantity: number
  /** Fecha ISO "YYYY-MM-DD"; `null` = el lote no vence. */
  expiresAt: string | null
}

export interface Product {
  /** Id interno inmutable (ej. "PRD-001"). */
  id: string
  /** Código comercial editable visible en etiquetas y búsqueda. */
  sku: string
  name: string
  slug: string
  brand: string
  model: string
  condition: ProductCondition
  /** Id de la categoría (ej. "computadoras"). */
  category: string
  /** Costo unitario de adquisición sin IVA; `null` si no se registró. */
  cost: number | null
  /** Precio de venta al consumidor final (IVA incluido). */
  price: number
  /** Precio anterior tachado para mostrar ahorro. */
  originalPrice: number | null
  /** Porcentaje de IVA incluido en `price` (13 en El Salvador). */
  taxRate: number
  /**
   * Existencias. Si `lotControl` está activo, es la suma de `lots[].quantity`
   * (la mantiene sincronizada el store; nunca se edita a mano).
   */
  stock: number
  /** Punto de reorden: a partir de este número el stock se considera crítico. */
  reorderPoint: number
  lotControl: boolean
  lots: ProductLot[]
  /** Visible en el catálogo público del Front Office. */
  active: boolean
  badge: string | null
  rating: number
  /** Portada: siempre `images[0]` (o el placeholder). Derivado; lo sincroniza `normalizeProduct`. */
  imageUrl: string
  /** Galería ordenada (máx. 8). La primera imagen es la portada. */
  images: string[]
  description: string
  compatibility: string
  connectivity: string
  specs: ProductSpec[]
}

/** Datos editables desde el formulario. Sin `id` se crea un producto nuevo. */
export type ProductDraft = Omit<Product, 'id' | 'slug' | 'rating' | 'badge'> & { id?: string }

export interface Category {
  id: string
  name: string
  slug: string
  /** Clase FontAwesome completa (ej. "fa-solid fa-laptop"). */
  icon: string
  description: string
}

export type CategoryDraft = Pick<Category, 'name' | 'icon' | 'description'>

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'hidden'

export type ProductViewMode = 'grid' | 'table'

/** Severidad de existencias según cantidad y punto de reorden. */
export type StockSeverity = 'out' | 'low' | 'ok'

/** Estado mostrado en el badge (considera además la visibilidad web). */
export type StockLevel = StockSeverity | 'hidden'

export interface InventoryMetrics {
  total: number
  active: number
  lowStock: number
  outOfStock: number
  totalValuation: number
}
