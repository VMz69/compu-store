import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORE_CONFIG, type StoreSettings } from '@/85-pipeline-identificadores-texto/03-store.config'
import { ApiError, onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { fetchSettings, saveSettingsApi } from './05-ajustes.api'

interface SettingsState {
  settings: StoreSettings
  isLoading: boolean
  /** Guarda en la API (L10); si falla, la caché no cambia y el error se propaga al formulario. */
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>
  reset: () => void
}

/** v1 (L10): la identidad vive en la API; toda caché anterior era de demostración. */
const SETTINGS_SCHEMA_VERSION = 1

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: STORE_CONFIG,
      isLoading: false,

      updateSettings: async (patch) => {
        set({ isLoading: true })
        try {
          const settings = await saveSettingsApi({ ...get().settings, ...patch })
          set({ settings, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Mantenimiento: la identidad se relee de la API (no hay valores de fábrica que restaurar).
      reset: () => {
        void loadSettings()
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      version: SETTINGS_SCHEMA_VERSION,
      partialize: (s) => ({ settings: s.settings }),
      // Toda versión anterior era demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ settings: STORE_CONFIG }),
      // Completa con los valores de fábrica los campos que no existían al guardar.
      merge: (persisted, current) => ({
        ...current,
        settings: { ...STORE_CONFIG, ...(persisted as Partial<SettingsState>)?.settings },
      }),
    },
  ),
)

/** Carga la identidad y el emisor desde la API (al iniciar o restaurar la sesión). */
async function loadSettings(): Promise<void> {
  try {
    useSettingsStore.setState({ settings: await fetchSettings() })
  } catch (error) {
    // L09: sin Ajustes, Tablero, Facturación ni Cotizaciones la API responde 403 por permiso; no es un fallo.
    if (error instanceof ApiError && error.code === 'PERMISSION_DENIED') return
    toast(`No se pudo cargar la identidad: ${error instanceof Error ? error.message : 'error del servidor.'}`, 'danger')
  }
}

onAuthenticated(() => void loadSettings())
