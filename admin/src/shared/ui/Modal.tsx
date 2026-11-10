import type { HTMLAttributes, ReactNode } from 'react'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { cn } from '@/shared/lib/cn'

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  onClose: () => void
  /** Ancho completo como clase Tailwind, ej. "w-[min(94vw,560px)]". */
  widthClass?: string
}

/** Contenedor de modal: overlay + panel. Las props extra (trazabilidad) van al panel. */
export function Modal({
  onClose,
  widthClass = 'w-[min(94vw,500px)]',
  className,
  children,
  ...rest
}: ModalProps) {
  useEscapeKey(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/75 backdrop-blur-md backdrop-saturate-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative bg-white dark:bg-slate-900 rounded-2xl shadow-modal dark:shadow-modal-dark flex flex-col overflow-hidden z-10 border border-slate-200 dark:border-slate-700 dark:ring-1 dark:ring-white/5',
          widthClass,
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  onClose: () => void
  closeMeta?: Record<string, string>
  children: ReactNode
}

export function ModalHeader({ onClose, closeMeta, children }: ModalHeaderProps) {
  return (
    <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 shrink-0">
      <div className="min-w-0">{children}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        {...closeMeta}
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ModalTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
      <i className={cn(icon, 'text-brand')} aria-hidden="true" />
      {children}
    </h3>
  )
}

export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center gap-2 shrink-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
