import { useSettingsStore } from '../store'

/** Identidad comercial vigente (editable desde Ajustes › Identidad). */
export function useStoreSettings() {
  return useSettingsStore((s) => s.settings)
}
