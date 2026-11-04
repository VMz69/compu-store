import type { ReactNode } from 'react'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/ui/EmptyState.tsx'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
  traceId: string
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  traceId,
}: EmptyStateProps) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-3xl p-12 sm:p-16 text-center max-w-md mx-auto border border-slate-200 dark:border-slate-800 shadow-soft-card"
    {...uiMeta({ id: traceId, component: 'EmptyState', source: SOURCE })}
  >
    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto mb-4 text-3xl">
      <i className={icon} />
    </div>
    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
      {description}
    </p>
    {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
  </div>
)
