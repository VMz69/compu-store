import { useMemo } from 'react'
import { useBrands, useCategories, useProducts } from '@/38-pipeline-datos-api/00-director-datos-api'
import { getBrandsWithCounts, getCategoriesWithCounts } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'

/**
 * Estadísticas derivadas del catálogo: conteos por categoría/marca y total de productos.
 */
export const useCatalogStats = () => {
  const products = useProducts()
  const categories = useCategories()
  const brands = useBrands()
  const categoriesWithCounts = useMemo(
    () => getCategoriesWithCounts(products, categories),
    [products, categories],
  )
  const brandsWithCounts = useMemo(() => getBrandsWithCounts(products, brands), [products, brands])

  return { categoriesWithCounts, brandsWithCounts, totalProducts: products.length }
}
