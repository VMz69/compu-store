import type { ReactNode } from 'react'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/04-pipeline-presentacion-secciones/03-titulo-seccion.tsx'

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
    className={`flex flex-wrap justify-between items-end gap-x-3 gap-y-1.5 mb-4 sm:mb-6 ${className}`}
    {...uiMeta({ id: traceId, component: 'SectionHeading', source: SOURCE })}
  >
    <div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
)
