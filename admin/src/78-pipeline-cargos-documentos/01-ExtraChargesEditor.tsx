import type { ExtraChargesApi } from '@/78-pipeline-cargos-documentos/02-useExtraCharges'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { tracer } from '@/00-trazabilidad'
import { AffixInput } from '../68-pipeline-marcos-contenido/04-AffixInput'
import { IconButton } from '../66-pipeline-acciones-administrativas/02-IconButton'
import { Input } from '../65-pipeline-campos-administrativos/00-director-campos-administrativos'

const t = tracer('ExtraChargesEditor', 'src/78-pipeline-cargos-documentos/01-ExtraChargesEditor.tsx')

const ERROR = 'text-[10px] font-semibold text-red-600 dark:text-red-400'

interface ExtraChargesEditorProps {
  title: string
  charges: ExtraChargesApi
  errors: Record<string, string | undefined>
  /** Texto cuando no hay cargos (explica para qué sirven en este documento). */
  emptyText: string
  /** Prefijo de trazabilidad (ej. "sales.builder.charges"). */
  traceId: string
}

/** Cargos extra de un documento (envío, instalación…): concepto + monto, con atajos. Compartido por pedidos y cotizaciones. */
export function ExtraChargesEditor({ title, charges: c, errors, emptyText, traceId }: ExtraChargesEditorProps) {

  return (
    <section className="space-y-2.5" {...t(traceId)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
        {c.total > 0 && <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">+{formatCurrency(c.total)}</span>}
      </div>

      {c.rows.length === 0 && (
        <p className="text-[11px] text-slate-400">{emptyText}</p>
      )}

      {c.rows.length > 0 && (
        <ul className="space-y-2">
          {c.rows.map((row, i) => {
            const conceptError = errors[`charges.${row.id}.concept`]
            const amountError = errors[`charges.${row.id}.amount`]
            return (
              <li key={row.id} className="space-y-0.5" {...t(`${traceId}.${row.id}`)}>
                <div className="flex items-start gap-2">
                  <Input
                    aria-label={`Concepto del cargo ${i + 1}`}
                    placeholder="Concepto (ej. Envío a domicilio)"
                    maxLength={60}
                    className="flex-1"
                    invalid={Boolean(conceptError)}
                    {...c.bind(row.id, 'concept')}
                    {...t(`${traceId}.${row.id}.concept`)}
                  />
                  <div className="w-28 shrink-0">
                    <AffixInput
                      prefix="$"
                      inputMode="decimal"
                      aria-label={`Monto del cargo ${i + 1} en dólares`}
                      placeholder="0.00"
                      className="text-right"
                      invalid={Boolean(amountError)}
                      {...c.bind(row.id, 'amount')}
                      {...t(`${traceId}.${row.id}.amount`)}
                    />
                  </div>
                  <IconButton icon="fa-solid fa-xmark" label="Quitar cargo" tone="plain" sizeClass="w-8 h-8" onClick={() => c.remove(row.id)} {...t(`${traceId}.${row.id}.remove`)} />
                </div>
                {(conceptError || amountError) && (
                  <p role="alert" className={ERROR}>{[conceptError, amountError].filter(Boolean).join(' · ')}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {errors.charges && <p role="alert" className={ERROR}>{errors.charges}</p>}

      {c.canAdd && (
        <div className="flex flex-wrap items-center gap-1.5">
          {c.presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => c.add(preset)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-colors"
              {...t(`${traceId}.preset.${preset}`)}
            >
              + {preset}
            </button>
          ))}
          <button type="button" onClick={() => c.add()} className="text-[11px] font-bold px-2.5 py-1 text-brand hover:text-brand-hover" {...t(`${traceId}.add`)}>
            <i className="fa-solid fa-plus mr-1" aria-hidden="true" />
            Otro cargo
          </button>
        </div>
      )}
    </section>
  )
}
