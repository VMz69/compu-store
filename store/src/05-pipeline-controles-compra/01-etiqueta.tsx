import type { HTMLAttributes, ReactNode } from 'react'

type BadgeTone = 'brand' | 'slate' | 'amber' | 'red' | 'emerald' | 'sky'

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand dark:bg-brand-950/60',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-500 text-white',
  emerald: 'bg-emerald-100 text-emerald-800',
  sky: 'bg-sky-100 text-sky-800',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

export const Badge = ({ tone = 'brand', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${TONES[tone]} ${className}`}
    {...props}
  >
    {children}
  </span>
)
