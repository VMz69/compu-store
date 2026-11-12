import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon: string
  title: string
  hint?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, hint, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-16 text-slate-400', className)} {...rest}>
      <i className={cn(icon, 'text-4xl mb-3 text-slate-300 dark:text-slate-700')} aria-hidden="true" />
      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
