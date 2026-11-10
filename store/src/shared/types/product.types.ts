export type SortBy = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name-asc'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

export interface Product {
  id: number
  name: string
  slug: string
  brand: string
  category: string
  price: number
  originalPrice: number | null
  stock: number
  badge: string | null
  rating: number
  reviewsCount: number
  imageUrl: string
  /** Fotos adicionales de la galería de detalle; la portada siempre es `imageUrl`. */
  images?: string[]
  description: string
  specs: string[]
}

export interface CategoryWithCount extends Category {
  count: number
}

export interface BrandWithCount extends Brand {
  count: number
}

export interface Promotion {
  id: number
  badge: string
  title: string
  discountText: string
  description: string
  ctaText: string
  targetCategory: string
  badgeColor: string
  imageUrl: string
  gradient: string
}

/**
 * Estado de moderación. El back office (/admin › Comentarios) aprueba o rechaza;
 * el Front Office solo muestra los `aprobado`.
 */
export type ReviewStatus = 'pendiente' | 'aprobado' | 'rechazado'

export interface Review {
  id: number
  author: string
  city: string
  rating: number
  date: string
  title: string
  comment: string
  verified: boolean
  /** Ausente en las reseñas de muestra (ya publicadas): se asume `aprobado`. */
  status?: ReviewStatus
}

export interface ProductFilters {
  category?: string
  brand?: string
  searchQuery?: string
  sortBy?: SortBy
  onlyOffers?: boolean
}
