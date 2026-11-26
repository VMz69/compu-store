import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Favoritos persistidos como ids. Guardar ids (no productos completos) evita
 * duplicar datos y mantiene los precios siempre actualizados desde el catálogo.
 */
interface FavStore {
  ids: number[]
  toggleFavorite: (productId: number) => boolean
  isFavorite: (productId: number) => boolean
  clearFavorites: () => void
  /** Al arrancar: descarta en silencio los ids que ya no existen en el catálogo. */
  purgeUnknown: (validIds: number[]) => void
}

export const useFavStore = create<FavStore>()(
  persist(
    (set, get) => ({
      ids: [],

      toggleFavorite: (productId) => {
        const exists = get().ids.includes(productId)
        set({
          ids: exists
            ? get().ids.filter((id) => id !== productId)
            : [...get().ids, productId],
        })
        return !exists
      },

      isFavorite: (productId) => get().ids.includes(productId),

      clearFavorites: () => set({ ids: [] }),

      purgeUnknown: (validIds) => {
        const valid = new Set(validIds)
        set({ ids: get().ids.filter((id) => valid.has(id)) })
      },
    }),
    { name: 'compustore_sv_favorites_v2' },
  ),
)
