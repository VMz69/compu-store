import { useMemo, useState } from 'react'
import { products } from '../mocks/products.mock'
import { useFavStore } from '../favorites.store'
import { useFavorites } from './useFavorites'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'

/**
 * Productos favoritos resueltos a partir de los ids persistidos, más el vaciado
 * de la lista con confirmación (mismo flujo que «Vaciar carrito»).
 */
export const useFavoritesView = () => {
  const { ids } = useFavorites()
  const clearFavoritesStore = useFavStore((state) => state.clearFavorites)
  const pushToast = useToastStore((state) => state.pushToast)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  const favoriteProducts = useMemo(
    () => products.filter((product) => ids.includes(product.id)),
    [ids],
  )

  const requestClearFavorites = () => setIsClearModalOpen(true)
  const cancelClearFavorites = () => setIsClearModalOpen(false)
  const confirmClearFavorites = () => {
    clearFavoritesStore()
    pushToast('Favoritos vaciados correctamente', 'info')
    setIsClearModalOpen(false)
  }

  return {
    products: favoriteProducts,
    isClearModalOpen,
    requestClearFavorites,
    cancelClearFavorites,
    confirmClearFavorites,
  }
}
