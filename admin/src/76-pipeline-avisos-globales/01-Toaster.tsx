import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { useToasts, type ToastTone } from '@/76-pipeline-avisos-globales/02-toast.store'
import { tracer } from '@/00-trazabilidad'

const t = tracer('Toaster', 'src/76-pipeline-avisos-globales/01-Toaster.tsx')

const TONES: Record<ToastTone, string> = {
  success: 'bg-brand text-white shadow-brand-glow',
  warning: 'bg-amber-500 text-white',
  info: 'bg-sidebar text-white border border-white/10',
  danger: 'bg-red-500 text-white',
}

const ICONS: Record<ToastTone, string> = {
  success: 'fa-solid fa-check-circle',
  warning: 'fa-solid fa-triangle-exclamation',
  info: 'fa-solid fa-circle-info',
  danger: 'fa-solid fa-circle-xmark',
}

export function Toaster() {
  const toasts = useToasts()

  return (
    <div
      className="fixed bottom-6 right-6 z-[80] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
      {...t('app.toasts')}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            TONES[toast.tone],
            'px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2.5 animate-fade-in pointer-events-auto transition-all duration-300',
            toast.leaving && 'opacity-0 translate-y-2.5',
          )}
          {...t(`app.toasts.item.${toast.id}`)}
        >
          <i className={cn(ICONS[toast.tone], 'text-sm')} aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
