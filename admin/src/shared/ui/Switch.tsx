import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked'> {
  checked: boolean
  label: string
}

/** Toggle minimalista. Las props extra (trazabilidad, onChange) van al <input> real. */
export function Switch({ checked, label, className, ...rest }: SwitchProps) {
  return (
    <label className={cn('relative inline-flex items-center cursor-pointer', className)} title={label}>
      <input type="checkbox" className="sr-only peer" checked={checked} aria-label={label} {...rest} />
      <span
        className={cn(
          'w-8 h-4 rounded-full border transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40',
          checked
            ? 'bg-brand border-brand'
            : 'bg-slate-300 border-slate-300 dark:bg-slate-700 dark:border-slate-600',
        )}
      />
      <span
        className={cn(
          'absolute top-[3px] left-[3px] w-2.5 h-2.5 bg-white rounded-full shadow-xs transition-transform duration-200',
          checked && 'translate-x-4',
        )}
      />
    </label>
  )
}
