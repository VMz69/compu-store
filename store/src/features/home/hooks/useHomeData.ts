import { useMemo } from 'react'
import { products } from '@/data'
import { getDeals } from '@/services/catalog.service'
import { useCatalogStats } from '@/hooks/useCatalogStats'

export const useHomeData = () => {
  const stats = useCatalogStats()

  const featuredProducts = useMemo(
    () => products.filter((product) => product.badge === 'Destacado').slice(0, 4),
    [],
  )
  const dealProducts = useMemo(() => getDeals(products, 4), [])

  return { ...stats, featuredProducts, dealProducts }
}
