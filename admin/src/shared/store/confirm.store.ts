import { create } from 'zustand'

export interface ConfirmReason {
  label: string
  placeholder?: string
  /** Mínimo de caracteres (sin espacios extremos) para habilitar la confirmación. */
  minLength?: number
}

export interface ConfirmRequest {
  title: string
  message: string
  confirmText?: string
  /** Pide un motivo antes de confirmar (ej. auditoría de eliminaciones); se entrega a `onConfirm`. */
  reason?: ConfirmReason
  onConfirm: (reason: string) => void | Promise<void>
}

interface ConfirmState {
  request: ConfirmRequest | null
  open: (request: ConfirmRequest) => void
  close: () => void
  accept: (reason?: string) => void
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
  accept: (reason = '') => {
    const current = get().request
    set({ request: null })
    void current?.onConfirm(reason.trim())
  },
}))

/** Atajo imperativo para abrir el diálogo global de confirmación. */
export const askConfirm = (request: ConfirmRequest): void => useConfirmStore.getState().open(request)
