import { uiMeta } from '@/ui-traceability'

import type { ToastMessage } from '@/store/useToastStore'

const SOURCE = 'src/components/ui/Toast.tsx'

const TONE: Record<ToastMessage['type'], string> = {
  success: 'bg-emerald-600 text-white border-emerald-700',
  warning: 'bg-amber-500 text-slate-900 border-amber-600',
  info: 'bg-slate-800 text-white border-slate-700',
}

const ICON: Record<ToastMessage['type'], string> = {
  success: 'fa-circle-check',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
}

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: number) => void
}

export const Toast = ({ toast, onDismiss }: ToastProps) => (
  <button
    type="button"
    onClick={() => onDismiss(toast.id)}
    className={`pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-lg sm:max-w-sm ${TONE[toast.type]}`}
    {...uiMeta({
      id: `ui.toast.${toast.id}`,
      component: 'Toast',
      source: SOURCE,
    })}
  >
    <i className={`fa-solid ${ICON[toast.type]} text-base`} />
    <span>{toast.message}</span>
  </button>
)
