import { useMemo } from 'react'
import { products } from '../mocks/products.mock'
import { useFavorites } from './useFavorites'

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
