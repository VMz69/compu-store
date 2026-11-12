import { useSettingsStore } from './02-store'

/** Identidad comercial vigente (editable desde Ajustes › Identidad). */
export function useStoreSettings() {
  return useSettingsStore((s) => s.settings)
}
