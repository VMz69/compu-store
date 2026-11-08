import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'brand'
  | 'purple'
  | 'highlight'
  | 'solid-brand'

const TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
  danger:
    'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
  brand:
    'bg-blue-50 text-brand border-brand/20 dark:bg-brand-950/40 dark:text-blue-300 dark:border-brand-800',
  purple:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  highlight: 'bg-amber-400 text-amber-950 border-transparent',
  'solid-brand': 'bg-brand text-white border-transparent',
}

export type BadgeShape = 'sm' | 'md' | 'full'

const SHAPES: Record<BadgeShape, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  full: 'rounded-full',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Sin `tone`, el color lo define `className` (ej. estilos de estado/rol provenientes de datos). */
  tone?: BadgeTone
  shape?: BadgeShape
  icon?: string
}

export function Badge({ tone, shape = 'md', icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border whitespace-nowrap',
        SHAPES[shape],
        tone && TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon && <i className={cn(icon, 'text-[9px]')} aria-hidden="true" />}
      {children}
    </span>
  )
}
