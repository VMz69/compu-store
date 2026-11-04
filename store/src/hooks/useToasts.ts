import { useToastStore } from '@/store/useToastStore'

/**
 * Acceso a la cola de notificaciones.
 */
export const useToasts = () => {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)
  return { toasts, dismissToast }
}
