import { useFavStore } from '../favorites.store'
import { useToastStore } from '@/shared/store/toast.store'
import type { Product } from '@/00-director-modelos'

/**
 * Favoritos del usuario: consulta, alternancia y toast de confirmación.
 */
export const useFavorites = () => {
  const ids = useFavStore((state) => state.ids)
  const toggleFavoriteId = useFavStore((state) => state.toggleFavorite)
  const pushToast = useToastStore((state) => state.pushToast)

  const isFavorite = (productId: number) => ids.includes(productId)

  const toggleFavorite = (product: Product) => {
    const added = toggleFavoriteId(product.id)
    pushToast(
      added ? '¡Agregado a tus favoritos!' : 'Eliminado de tus favoritos',
      added ? 'success' : 'info',
    )
  }

  return { ids, count: ids.length, isFavorite, toggleFavorite }
}
