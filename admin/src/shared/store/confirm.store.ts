import { create } from 'zustand'

export interface ConfirmRequest {
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void | Promise<void>
}

interface ConfirmState {
  request: ConfirmRequest | null
  open: (request: ConfirmRequest) => void
  close: () => void
  accept: () => void
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
  accept: () => {
    const current = get().request
    set({ request: null })
    void current?.onConfirm()
  },
}))

/** Atajo imperativo para abrir el diálogo global de confirmación. */
export const askConfirm = (request: ConfirmRequest): void => useConfirmStore.getState().open(request)
