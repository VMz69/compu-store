import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Superficie base: tarjeta blanca con borde y sombra suave. El padding lo decide el consumidor. */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Título de sección en mayúsculas usado dentro de tarjetas y paneles. */
export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h4
      className={cn(
        'text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100',
        className,
      )}
    >
      {children}
    </h4>
  )
}
