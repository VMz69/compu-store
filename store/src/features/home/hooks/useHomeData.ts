import { useMemo } from 'react'
import { getDeals, products, useCatalogStats } from '@/features/catalog'

export const useHomeData = () => {
  const stats = useCatalogStats()

  const featuredProducts = useMemo(
    () => products.filter((product) => product.badge === 'Destacado').slice(0, 4),
    [],
  )
  const dealProducts = useMemo(() => getDeals(products, 4), [])

  return { ...stats, featuredProducts, dealProducts }
}
