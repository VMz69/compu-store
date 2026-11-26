import { useMemo } from 'react'
import { getDeals, useCatalogStats, useProducts } from '@/00-director-catalogo'

export const useHomeData = () => {
  const stats = useCatalogStats()
  const products = useProducts()

  const featuredProducts = useMemo(
    () => products.filter((product) => product.badge === 'Destacado').slice(0, 4),
    [products],
  )
  const dealProducts = useMemo(() => getDeals(products, 4), [products])

  return { ...stats, featuredProducts, dealProducts }
}
