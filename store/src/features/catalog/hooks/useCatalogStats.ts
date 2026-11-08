import { useMemo } from 'react'
import { brands, categories, products } from '@/data'
import { getBrandsWithCounts, getCategoriesWithCounts } from '@/services/catalog.service'

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
