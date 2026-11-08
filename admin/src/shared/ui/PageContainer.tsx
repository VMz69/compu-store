import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Padding completo, ej. "p-5" o "p-4 sm:p-6". */
  padding?: string
  /** Separación vertical entre bloques, ej. "space-y-5". */
  spacing?: string
}

/** Área desplazable de una vista dentro del layout administrativo. */
export function PageContainer({
  padding = 'p-5',
  spacing = 'space-y-5',
  className,
  children,
  ...rest
}: PageContainerProps) {
  return (
    <div
      className={cn('h-full overflow-y-auto custom-scrollbar animate-fade-in', padding, spacing, className)}
      {...rest}
    >
      {children}
    </div>
  )
}
