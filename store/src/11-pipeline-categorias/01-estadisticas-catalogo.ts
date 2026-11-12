import { useMemo } from 'react'
import { brands } from '@/06-pipeline-datos-mock/00-director-datos-mock'
import { categories } from '@/06-pipeline-datos-mock/00-director-datos-mock'
import { products } from '@/06-pipeline-datos-mock/00-director-datos-mock'
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
