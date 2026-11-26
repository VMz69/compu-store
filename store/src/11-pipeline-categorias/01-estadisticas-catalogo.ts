import { useMemo } from 'react'
import { brands } from '@/38-pipeline-datos-api/00-director-datos-api'
import { categories } from '@/38-pipeline-datos-api/00-director-datos-api'
import { products } from '@/38-pipeline-datos-api/00-director-datos-api'
import { getBrandsWithCounts, getCategoriesWithCounts } from '@/10-pipeline-consulta-catalogo/00-director-consulta-catalogo'

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
