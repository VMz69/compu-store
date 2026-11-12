import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { Input, type InputProps } from '../65-pipeline-campos-administrativos/00-director-campos-administrativos'

interface AffixInputProps extends InputProps {
  /** Texto fijo antes del valor (ej. "$"). */
  prefix?: string
  /** Texto fijo después del valor (ej. "%", "unid."). */
  suffix?: string
}

/**
 * Input con prefijo/sufijo de unidad. Los afijos son decorativos
 * (`aria-hidden`): la unidad debe ir también en la etiqueta del campo.
 */
export function AffixInput({ prefix, suffix, className, ...rest }: AffixInputProps) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none" aria-hidden="true">
          {prefix}
        </span>
      )}
      <Input className={cn(prefix && 'pl-6', suffix && 'pr-12', 'tabular-nums', className)} {...rest} />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none" aria-hidden="true">
          {suffix}
        </span>
      )}
    </div>
  )
}
