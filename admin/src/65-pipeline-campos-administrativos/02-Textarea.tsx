import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { controlTone, type ControlTone } from './05-controlStyles'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: ControlTone
  /** Marca el control con error (borde rojo + aria-invalid). */
  invalid?: boolean
}

export function Textarea({ tone = 'default', invalid, className = 'h-16', ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn('w-full p-2.5 rounded-lg text-xs resize-none', controlTone(tone, invalid), className)}
      {...rest}
    />
  )
}
