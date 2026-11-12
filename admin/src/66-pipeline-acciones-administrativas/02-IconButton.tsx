import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'

export type IconButtonTone = 'neutral' | 'brand' | 'danger' | 'plain' | 'overlay'

const TONES: Record<IconButtonTone, string> = {
  neutral:
    'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand',
  brand:
    'bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/20 hover:border-brand shadow-2xs',
  danger:
    'bg-red-50 dark:bg-red-950/40 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 dark:border-red-900/40 shadow-2xs',
  plain: 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
  /** Sobre fondos oscuros o imágenes (visor, miniaturas). */
  overlay: 'text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Clase FontAwesome completa, ej. "fa-solid fa-pen". */
  icon: string
  /** Texto accesible obligatorio (tooltip + aria-label). */
  label: string
  tone?: IconButtonTone
  sizeClass?: string
  iconClass?: string
}

export function IconButton({
  icon,
  label,
  tone = 'neutral',
  sizeClass = 'w-8 h-8',
  iconClass = 'text-xs',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all shrink-0',
        sizeClass,
        TONES[tone],
        className,
      )}
      {...rest}
    >
      <i className={cn(icon, iconClass)} aria-hidden="true" />
    </button>
  )
}
