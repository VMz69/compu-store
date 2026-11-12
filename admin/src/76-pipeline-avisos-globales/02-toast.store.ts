import { create } from 'zustand'

export type ToastTone = 'success' | 'warning' | 'info' | 'danger'

export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
  leaving: boolean
}

interface ToastState {
  toasts: ToastItem[]
  show: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

const VISIBLE_MS = 3200
const EXIT_MS = 300
let sequence = 0

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (message, tone = 'success') => {
    const id = ++sequence
    set((s) => ({ toasts: [...s.toasts, { id, message, tone, leaving: false }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }))
      setTimeout(() => get().dismiss(id), EXIT_MS)
    }, VISIBLE_MS)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Atajo imperativo para usar desde hooks de acciones. */
export const toast = (message: string, tone?: ToastTone): void =>
  useToastStore.getState().show(message, tone)

export const useToasts = (): ToastItem[] => useToastStore((s) => s.toasts)
