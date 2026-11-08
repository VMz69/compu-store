import type { ReactNode } from 'react'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/shared/ui/PageBanner.tsx'

interface PageBannerProps {
  badge?: string
  title: string
  description: string
  icon?: string
  gradient?: string
  children?: ReactNode
  traceId: string
}

export const PageBanner = ({
  badge,
  title,
  description,
  icon,
  gradient = 'from-brand-navy via-brand to-brand-accent',
  children,
  traceId,
}: PageBannerProps) => (
  <div
    className={`bg-gradient-to-r ${gradient} rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-md`}
    {...uiMeta({ id: traceId, component: 'PageBanner', source: SOURCE })}
  >
    <div className="space-y-2 max-w-2xl text-center sm:text-left">
      {badge ? (
        <span className="inline-block bg-white/20 text-sky-100 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      ) : null}
      <div className="flex items-center justify-center sm:justify-start gap-2">
        {icon ? <i className={`${icon} text-2xl text-amber-300`} /> : null}
        <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
      </div>
      <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-xl">{description}</p>
    </div>
    {children}
  </div>
)
