import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { controlTone, type ControlTone } from './controlStyles'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  tone?: ControlTone
  /** Marca el control con error (borde rojo + aria-invalid). */
  invalid?: boolean
}

export function Input({ tone = 'default', invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn('w-full h-8 px-3 rounded-lg text-xs transition-shadow', controlTone(tone, invalid), className)}
      {...rest}
    />
  )
}
