import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import type { PasswordCheck } from '../../lib/password'

/** Color de la barra según cuántas reglas se cumplen (0–5). Clases completas. */
const BAR_BY_SCORE = ['bg-slate-200', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600']
const LABEL_BY_SCORE = ['', 'Muy débil', 'Débil', 'Aceptable', 'Segura', 'Muy segura']
const WIDTH_BY_SCORE = ['w-0', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full']

interface PasswordStrengthProps {
  checks: PasswordCheck[]
  score: number
}

/** Medidor de fortaleza + lista de requisitos que se marcan mientras se escribe. */
export function PasswordStrength({ checks, score }: PasswordStrengthProps) {
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', BAR_BY_SCORE[score], WIDTH_BY_SCORE[score])} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-16 text-right">
          {LABEL_BY_SCORE[score]}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((check) => (
          <li
            key={check.id}
            className={cn(
              'text-[10px] flex items-center gap-1.5',
              check.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400',
            )}
          >
            <i className={check.passed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'} aria-hidden="true" />
            {check.label}
            <span className="sr-only">{check.passed ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
