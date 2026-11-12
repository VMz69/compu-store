import type { InputHTMLAttributes } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { Switch } from './03-Switch'

interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'title'> {
  checked: boolean
  title: string
  description: string
  /** Ícono FontAwesome completo con su color. */
  icon?: string
}

/**
 * Tarjeta de configuración binaria: título + explicación + interruptor.
 * Cambia de acento cuando está activa para que el estado se lea sin mirar el switch.
 */
export function SwitchField({ checked, title, description, icon, className, ...rest }: SwitchFieldProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-colors',
        checked
          ? 'bg-brand-50/60 border-brand/30 dark:bg-brand-950/30 dark:border-brand-800/60'
          : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <i className={icon} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{title}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">{description}</span>
        </div>
      </div>
      <Switch checked={checked} label={title} {...rest} />
    </div>
  )
}
