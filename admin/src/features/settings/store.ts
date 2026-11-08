import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_CONFIG, type StoreSettings } from '@/shared/config/store.config'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'

interface SettingsState {
  settings: StoreSettings
  isLoading: boolean
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: STORE_CONFIG,
      isLoading: false,

      updateSettings: async (patch) => {
        set({ isLoading: true })
        await delay()
        set((s) => ({ settings: { ...s.settings, ...patch }, isLoading: false }))
      },

      reset: () => set({ settings: STORE_CONFIG }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      partialize: (s) => ({ settings: s.settings }),
      // Completa con los valores de fábrica los campos que no existían al guardar
      // (p. ej. los datos fiscales del emisor agregados con Facturación).
      merge: (persisted, current) => ({
        ...current,
        settings: { ...STORE_CONFIG, ...(persisted as Partial<SettingsState>)?.settings },
      }),
    },
  ),
)
