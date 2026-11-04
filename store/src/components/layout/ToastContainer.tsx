import { Toast } from '@/components/ui/Toast'
import { useToasts } from '@/hooks/useToasts'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/layout/ToastContainer.tsx'

export const ToastContainer = () => {
  const { toasts, dismissToast } = useToasts()

  return (
    <div
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none sm:right-6"
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
