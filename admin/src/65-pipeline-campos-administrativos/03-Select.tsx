import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { controlTone, type ControlTone } from './05-controlStyles'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  tone?: ControlTone
  /** Marca el control con error (borde rojo + aria-invalid). */
  invalid?: boolean
}

export function Select({ options, tone = 'default', invalid, className, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn('h-8 px-3 rounded-lg text-xs cursor-pointer', controlTone(tone, invalid), className)}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
