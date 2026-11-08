import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type FieldVariant = 'form' | 'caps'

const LABELS: Record<FieldVariant, string> = {
  form: 'block font-bold text-slate-600 dark:text-slate-300 mb-1',
  caps: 'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1',
}

interface FieldProps {
  label: string
  hint?: string
  /** Mensaje de error; reemplaza al `hint` mientras exista. */
  error?: string
  /** Muestra un asterisco rojo (la validación real vive en el hook). */
  required?: boolean
  /** Contenido a la derecha de la etiqueta (ej. un badge de modo). */
  aside?: ReactNode
  variant?: FieldVariant
  className?: string
  children: ReactNode
}

/** Etiqueta + control. Envolver el control en <label> lo asocia sin ids manuales. */
export function Field({ label, hint, error, required, aside, variant = 'form', className, children }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className="flex items-center justify-between gap-2">
        <span className={LABELS[variant]}>
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </span>
        {aside}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation text-[9px]" aria-hidden="true" /> {error}
        </span>
      ) : (
        hint && <span className="text-[10px] text-slate-400 mt-1 block">{hint}</span>
      )}
    </label>
  )
}
