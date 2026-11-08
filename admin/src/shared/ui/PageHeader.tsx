import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action, className, ...rest }: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}
      {...rest}
    >
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
