import { useEffect } from 'react'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/shared/ui/ConfirmDialog.tsx'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'brand'
  onConfirm: () => void
  onCancel: () => void
}

const TONE: Record<NonNullable<ConfirmDialogProps['tone']>, { icon: string; button: string }> = {
  danger: {
    icon: 'fa-solid fa-triangle-exclamation text-red-500',
    button: 'bg-red-500 hover:bg-red-600 text-white',
  },
  brand: {
    icon: 'fa-solid fa-circle-question text-brand',
    button: 'bg-brand hover:bg-brand-hover text-white',
  },
}

/**
 * Diálogo de confirmación reutilizable, acorde al design system.
 * Reemplaza `window.confirm` con una UI controlada, accesible y con backdrop.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onCancel])

  if (!open) return null

  const styles = TONE[tone]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      {...uiMeta({ id: 'ui.confirm-dialog', component: 'ConfirmDialog', source: SOURCE })}
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] animate-fade-in"
        {...uiMeta({
          id: 'ui.confirm-dialog.backdrop',
          component: 'ConfirmDialog',
          source: SOURCE,
        })}
      />
      <div className="relative w-full max-w-md animate-fade-in rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft-hover dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <i className={`${styles.icon} text-xl`} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-black text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            {...uiMeta({
              id: 'ui.confirm-dialog.cancel',
              component: 'ConfirmDialog',
              source: SOURCE,
            })}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 ${styles.button}`}
            {...uiMeta({
              id: 'ui.confirm-dialog.confirm',
              component: 'ConfirmDialog',
              source: SOURCE,
            })}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}