import { useMemo } from 'react'
import { brands } from '../mocks/brands.mock'
import { categories } from '../mocks/categories.mock'
import { products } from '../mocks/products.mock'
import { getBrandsWithCounts, getCategoriesWithCounts } from '../lib/catalog.service'

/**
 * Estadísticas derivadas del catálogo: conteos por categoría/marca y total de productos.
 */
export const useCatalogStats = () => {
  const categoriesWithCounts = useMemo(
    () => getCategoriesWithCounts(products, categories),
    [],
  )
  const brandsWithCounts = useMemo(() => getBrandsWithCounts(products, brands), [])

  return { categoriesWithCounts, brandsWithCounts, totalProducts: products.length }
}
