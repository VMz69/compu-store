import { formatCurrency } from '@/shared/lib/currency'
import { AffixInput, IconButton, Input } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderBuilderApi } from '../../hooks/useOrderBuilder'

const t = tracer('OrderChargesSection', 'src/features/sales/components/builder/OrderChargesSection.tsx')

const ERROR = 'text-[10px] font-semibold text-red-600 dark:text-red-400'

/** Paso 4 · Cargos extra al pago (envío, instalación…): suman al total y se facturan como servicio. */
export function OrderChargesSection({ b }: { b: OrderBuilderApi }) {
  const c = b.charges

  return (
    <section className="space-y-2.5" {...t('sales.builder.charges')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">4 · Cargos extra</h3>
        {c.total > 0 && <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">+{formatCurrency(c.total)}</span>}
      </div>

      {c.rows.length === 0 && (
        <p className="text-[11px] text-slate-400">Opcional. Envío, instalación u otros servicios que el cliente paga junto al pedido.</p>
      )}

      {c.rows.length > 0 && (
        <ul className="space-y-2">
          {c.rows.map((row, i) => {
            const conceptError = b.errors[`charges.${row.id}.concept`]
            const amountError = b.errors[`charges.${row.id}.amount`]
            return (
              <li key={row.id} className="space-y-0.5" {...t(`sales.builder.charge.${row.id}`)}>
                <div className="flex items-start gap-2">
                  <Input
                    aria-label={`Concepto del cargo ${i + 1}`}
                    placeholder="Concepto (ej. Envío a domicilio)"
                    maxLength={60}
                    className="flex-1"
                    invalid={Boolean(conceptError)}
                    {...c.bind(row.id, 'concept')}
                    {...t(`sales.builder.charge.${row.id}.concept`)}
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
                      {...t(`sales.builder.charge.${row.id}.amount`)}
                    />
                  </div>
                  <IconButton icon="fa-solid fa-xmark" label="Quitar cargo" tone="plain" sizeClass="w-8 h-8" onClick={() => c.remove(row.id)} {...t(`sales.builder.charge.${row.id}.remove`)} />
                </div>
                {(conceptError || amountError) && (
                  <p role="alert" className={ERROR}>{[conceptError, amountError].filter(Boolean).join(' · ')}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {b.errors.charges && <p role="alert" className={ERROR}>{b.errors.charges}</p>}

      {c.canAdd && (
        <div className="flex flex-wrap items-center gap-1.5">
          {c.presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => c.add(preset)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-colors"
              {...t(`sales.builder.charge.preset.${preset}`)}
            >
              + {preset}
            </button>
          ))}
          <button type="button" onClick={() => c.add()} className="text-[11px] font-bold px-2.5 py-1 text-brand hover:text-brand-hover" {...t('sales.builder.charge.add')}>
            <i className="fa-solid fa-plus mr-1" aria-hidden="true" />
            Otro cargo
          </button>
        </div>
      )}
    </section>
  )
}
