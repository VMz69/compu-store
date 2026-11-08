import type {
  Brand,
  BrandWithCount,
  Category,
  CategoryWithCount,
  Product,
  ProductFilters,
} from '@/shared/types'

/**
 * Dominio de catálogo. Funciones puras y sin dependencias de React: reciben
 * productos y devuelven nuevas colecciones, de modo que puedan moverse a una
 * API o a un backend sin tocar los componentes.
 */

/** Agrega a cada categoría el número de productos publicados. */
export const getCategoriesWithCounts = (
  products: Product[],
  categories: Category[],
): CategoryWithCount[] =>
  categories.map((category) => ({
    ...category,
    count: products.filter((product) => product.category === category.slug).length,
  }))

export const getBrandsWithCounts = (products: Product[], brands: Brand[]): BrandWithCount[] =>
  brands.map((brand) => ({
    ...brand,
    count: products.filter((product) => product.brand === brand.slug).length,
  }))

/** Búsqueda insensible a mayúsculas sobre nombre, descripción, categoría, marca y specs. */
const matchesSearch = (product: Product, query: string): boolean => {
  const term = query.toLowerCase().trim()
  if (!term) return true
  return (
    product.name.toLowerCase().includes(term) ||
    product.description.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term) ||
    product.brand.toLowerCase().includes(term) ||
    product.specs.some((spec) => spec.toLowerCase().includes(term))
  )
}

/** Ordena una copia de la colección; nunca muta el arreglo original. */
const sortProducts = (items: Product[], sortBy: ProductFilters['sortBy']): Product[] => {
  const sorted = [...items]
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'discount':
      return sorted.sort(
        (a, b) =>
          (b.originalPrice ? b.originalPrice - b.price : 0) -
          (a.originalPrice ? a.originalPrice - a.price : 0),
      )
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'featured':
    default:
      return sorted.sort((a, b) => {
        const aFeatured = a.badge === 'Destacado' ? 1 : 0
        const bFeatured = b.badge === 'Destacado' ? 1 : 0
        return bFeatured - aFeatured || a.id - b.id
      })
  }
}

/**
 * Punto único de filtrado + ordenamiento del catálogo.
 * `onlyOffers` considera oferta solo si existe `originalPrice` mayor al precio actual.
 */
export const filterAndSort = (
  products: Product[],
  { category, brand, searchQuery = '', sortBy = 'featured', onlyOffers = false }: ProductFilters,
): Product[] => {
  const filtered = products.filter((product) => {
    if (category && category !== 'all' && product.category !== category) return false
    if (brand && brand !== 'all' && product.brand !== brand) return false
    if (onlyOffers && !(product.originalPrice && product.originalPrice > product.price)) {
      return false
    }
    return matchesSearch(product, searchQuery)
  })

  return sortProducts(filtered, sortBy)
}

export const getProductById = (products: Product[], id: number): Product | undefined =>
  products.find((product) => product.id === Number(id))

/** Productos de la misma categoría o marca, excluyendo el producto actual. */
export const getRelatedProducts = (
  products: Product[],
  currentProduct: Product,
  limit = 4,
): Product[] =>
  products
    .filter(
      (product) =>
        product.id !== currentProduct.id &&
        (product.category === currentProduct.category || product.brand === currentProduct.brand),
    )
    .slice(0, limit)

/** Productos con descuento real (`originalPrice` mayor al precio vigente). */
export const getDeals = (products: Product[], limit?: number): Product[] => {
  const deals = products.filter(
    (product) => product.originalPrice && product.originalPrice > product.price,
  )
  return typeof limit === 'number' ? deals.slice(0, limit) : deals
}

/** Fotos de la galería de detalle: portada primero y sin duplicados. */
export const getProductImages = (product: Product): string[] =>
  Array.from(new Set([product.imageUrl, ...(product.images ?? [])]))
