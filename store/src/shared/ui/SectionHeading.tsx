import type { ReactNode } from 'react'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/ui/SectionHeading.tsx'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: ReactNode
  traceId: string
  className?: string
}

export const SectionHeading = ({
  title,
  subtitle,
  action,
  traceId,
  className = '',
}: SectionHeadingProps) => (
  <div
    className={`flex flex-wrap justify-between items-end gap-3 mb-6 ${className}`}
    {...uiMeta({ id: traceId, component: 'SectionHeading', source: SOURCE })}
  >
    <div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
)
