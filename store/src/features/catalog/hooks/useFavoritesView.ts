import { useMemo } from 'react'
import { products } from '@/data'
import { useFavorites } from '@/hooks/useFavorites'

/**
 * Productos favoritos resueltos a partir de los ids persistidos.
 */
export const useFavoritesView = () => {
  const { ids } = useFavorites()
  const favoriteProducts = useMemo(
    () => products.filter((product) => ids.includes(product.id)),
    [ids],
  )

  return { products: favoriteProducts }
}
