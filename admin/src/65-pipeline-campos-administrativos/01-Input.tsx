import type { InputHTMLAttributes } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { controlTone, type ControlTone } from './05-controlStyles'

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
