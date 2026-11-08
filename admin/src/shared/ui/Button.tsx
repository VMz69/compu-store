import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'whatsapp'
  | 'soft'
  | 'muted'
  | 'tint'
  | 'danger-soft'
export type ButtonSize = 'xs' | 'sm' | 'md'
export type ButtonShape = 'lg' | 'xl'

const SHAPES: Record<ButtonShape, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
  outline:
    'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-xs',
  whatsapp: 'bg-whatsapp hover:bg-whatsapp-hover text-white shadow-xs',
  soft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand hover:text-white',
  muted:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
  tint: 'bg-brand/10 hover:bg-brand text-brand hover:text-white shadow-2xs',
  'danger-soft':
    'border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white shadow-2xs',
}

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-3 text-[11px]',
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-9 px-4 text-xs',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  /** Clase FontAwesome completa, ej. "fa-solid fa-plus". */
  icon?: string
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'sm',
  shape = 'lg',
  icon,
  isLoading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-bold transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        SHAPES[shape],
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <i className="fa-solid fa-spinner fa-spin text-[10px]" aria-hidden="true" />
      ) : (
        icon && <i className={cn(icon, 'text-[10px]')} aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
