import { cn } from '@/83-pipeline-recursos-publicos/02-cn'

export type ProgressTone = 'success' | 'warning' | 'danger'

const LABEL_TONES: Record<ProgressTone, string> = {
  success: 'text-emerald-600',
  warning: 'text-amber-500',
  danger: 'text-red-500',
}

const BAR_TONES: Record<ProgressTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  danger: 'bg-red-500',
}

interface ProgressBarProps {
  label: string
  /** Porcentaje 0-100 ya calculado por el hook. */
  value: number
  tone: ProgressTone
}

export function ProgressBar({ label, value, tone }: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold mb-1">
        <span className={LABEL_TONES[tone]}>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={cn('h-full rounded-full', BAR_TONES[tone])} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
