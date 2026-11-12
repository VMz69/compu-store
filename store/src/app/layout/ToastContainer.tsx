import { Toast } from '@/shared/ui/Toast'
import { useToasts } from '@/shared/hooks/useToasts'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/ToastContainer.tsx'

interface ToastContainerProps {
  /** Con la barra de compra móvil activa, sube sobre ella (incluida la safe-area). */
  aboveActionBar?: boolean
}

export const ToastContainer = ({ aboveActionBar = false }: ToastContainerProps) => {
  const { toasts, dismissToast } = useToasts()

  return (
    <div
      className={`fixed right-4 z-50 flex flex-col items-end gap-2 pointer-events-none sm:right-6 ${
        aboveActionBar ? 'bottom-[calc(6.5rem+env(safe-area-inset-bottom))] lg:bottom-24' : 'bottom-24'
      }`}
      aria-live="polite"
      role="status"
      {...uiMeta({ id: 'ui.toast-container', component: 'ToastContainer', source: SOURCE })}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
