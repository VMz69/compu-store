import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  wrapperClassName?: string
}

export function SearchInput({ wrapperClassName = 'w-64', className, ...rest }: SearchInputProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <i
        className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
        aria-hidden="true"
      />
      <input
        type="search"
        className={cn(
          'w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
