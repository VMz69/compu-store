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

export interface Review {
  id: number
  author: string
  city: string
  rating: number
  date: string
  title: string
  comment: string
  verified: boolean
}

export interface ProductFilters {
  category?: string
  brand?: string
  searchQuery?: string
  sortBy?: SortBy
  onlyOffers?: boolean
}
