import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Card } from './Card'

export type KpiTone = 'success' | 'warning' | 'brand' | 'danger' | 'muted'

const ICON_TONES: Record<KpiTone, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
  warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
  brand: 'bg-blue-50 dark:bg-blue-950/40 text-brand',
  danger: 'bg-red-50 dark:bg-red-950/40 text-red-500',
  muted: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
}

const HINT_TONES: Record<KpiTone, string> = {
  success: 'text-emerald-600 font-bold',
  warning: 'text-amber-600 font-bold',
  brand: 'text-brand font-bold',
  danger: 'text-red-500 font-bold',
  muted: 'text-slate-400',
}

/** Datos de un KPI (sin atributos HTML), útiles para configurarlos desde hooks. */
export interface KpiData {
  label: string
  value: ReactNode
  hint: string
  hintIcon: string
  hintTone: KpiTone
  icon: string
  iconTone: KpiTone
}

export type KpiCardProps = KpiData & HTMLAttributes<HTMLDivElement>

export function KpiCard({ label, value, hint, hintIcon, hintTone, icon, iconTone, ...rest }: KpiCardProps) {
  return (
    <Card className="p-4 flex items-center justify-between" {...rest}>
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{value}</h4>
        <span className={cn('text-[10px] flex items-center gap-1 mt-1', HINT_TONES[hintTone])}>
          <i className={hintIcon} aria-hidden="true" /> {hint}
        </span>
      </div>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-lg', ICON_TONES[iconTone])}>
        <i className={icon} aria-hidden="true" />
      </div>
    </Card>
  )
}
