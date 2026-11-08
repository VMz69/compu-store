import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Breadcrumb } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('SettingsSubHeader', 'src/features/settings/components/SettingsSubHeader.tsx')

interface SettingsSubHeaderProps {
  section: string
  title: string
  /** Clase FontAwesome completa con color, ej. "fa-solid fa-building text-brand". */
  icon: string
  action?: ReactNode
}

/** Barra de sub-navegación de Ajustes: volver + breadcrumb + título. */
export function SettingsSubHeader({ section, title, icon, action }: SettingsSubHeaderProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800"
      {...t('settings.subheader')}
    >
      <div className="flex items-center gap-3">
        <Link
          to="/ajustes"
          className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          {...t('settings.subheader.back')}
        >
          <i className="fa-solid fa-arrow-left text-[11px]" aria-hidden="true" /> Volver a Ajustes
        </Link>
        <div>
          <Breadcrumb
            items={[
              { label: 'Ajustes', to: '/ajustes', meta: t('settings.subheader.breadcrumb') },
              { label: section },
            ]}
          />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <i className={cn(icon)} aria-hidden="true" /> {title}
          </h3>
        </div>
      </div>
      {action}
    </div>
  )
}
