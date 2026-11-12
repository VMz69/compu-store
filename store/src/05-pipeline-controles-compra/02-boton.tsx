import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'navy'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:bg-brand-hover text-white shadow-xs',
  secondary:
    'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand hover:text-brand',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800/70',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-xs',
  whatsapp: 'bg-whatsapp hover:bg-whatsapp-hover text-white shadow-md',
  navy: 'bg-brand-navy/60 hover:bg-brand-navy text-white border border-white/20',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export const Button = ({ variant = 'primary', className = '', children, ...props }: ButtonProps) => (
  <button
    className={`inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
)
