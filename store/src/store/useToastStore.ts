import { create } from 'zustand'

/**
 * Cola efímera de notificaciones. Cada toast se autodestruye a los 3.2 s y no
 * se persiste; recargar la página limpia la cola.
 */
export type ToastType = 'success' | 'warning' | 'info'

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: ToastMessage[]
  pushToast: (message: string, type?: ToastType) => void
  dismissToast: (id: number) => void
}

let toastSequence = 0

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  pushToast: (message, type = 'success') => {
    const id = ++toastSequence
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), 3200)
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
