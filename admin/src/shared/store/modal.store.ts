import { create } from 'zustand'

/**
 * Store global de modales. Cada feature registra sus claves (`MODALS`) y el
 * `ModalHost` de la app resuelve qué componente pintar.
 */
interface ModalState {
  type: string | null
  payload: unknown
  open: (type: string, payload?: unknown) => void
  close: () => void
}

export const useModalStore = create<ModalState>()((set) => ({
  type: null,
  payload: null,
  open: (type, payload = null) => set({ type, payload }),
  close: () => set({ type: null, payload: null }),
}))

export const openModal = (type: string, payload?: unknown): void =>
  useModalStore.getState().open(type, payload)

export const closeModal = (): void => useModalStore.getState().close()

/** Payload tipado del modal activo. Cada modal conoce la forma de su payload. */
export const useModalPayload = <T>(): T => useModalStore((s) => s.payload) as T
