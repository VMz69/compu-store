import { AffixInput, DatePicker, Field, IconButton, Input } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductFormApi } from '../18-pipeline-edicion-producto/02-useProductForm'

const t = tracer('LotRowsEditor', 'src/features/catalog/components/form/tabs/LotRowsEditor.tsx')

/** Desglose de lotes/cajas. El total alimenta el stock autocalculado. */
export function LotRowsEditor({ api }: { api: ProductFormApi }) {
  const { form, errors, computedStock } = api
  const lots = form.values.lots
  const canRemove = lots.length > 1

  return (
    <section className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800" {...t('catalog.product-form.lots')}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Desglose de lotes ({lots.length})
        </h4>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Total calculado: <b className="text-brand tabular-nums">{computedStock} unid.</b>
        </span>
      </div>

      <ul className="space-y-2.5">
        {lots.map((lot, index) => {
          const err = (field: string) => errors[`lots.${lot.id}.${field}`]
          const noExpiry = form.bindLotNoExpiry(lot.id)
          return (
            <li
              key={lot.id}
              className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_auto] gap-3 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              {...t(`catalog.product-form.lots.row.${index + 1}`)}
            >
              <Field label="Cantidad" variant="caps" required error={err('quantity')}>
                <AffixInput
                  suffix="unid."
                  type="number"
                  min="0"
                  inputMode="numeric"
                  invalid={Boolean(err('quantity'))}
                  {...form.bindLot(lot.id, 'quantity')}
                />
              </Field>
              <Field label="No. de lote" variant="caps" required error={err('lotNumber')}>
                <Input
                  placeholder="Ej. L-24A"
                  className="font-mono uppercase"
                  invalid={Boolean(err('lotNumber'))}
                  {...form.bindLot(lot.id, 'lotNumber')}
                />
              </Field>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vencimiento</span>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 accent-brand" {...noExpiry} {...t(`catalog.product-form.lots.no-expiry.${index + 1}`)} /> No vence
                  </label>
                </div>
                <DatePicker
                  aria-label={`Vencimiento del lote ${index + 1}`}
                  disabled={noExpiry.checked}
                  invalid={Boolean(err('expiresAt'))}
                  placeholder={noExpiry.checked ? 'No vence' : 'Elegir fecha'}
                  {...form.bindLot(lot.id, 'expiresAt')}
                  {...t(`catalog.product-form.lots.expiry.${index + 1}`)}
                />
                {err('expiresAt') && (
                  <span role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1 block">
                    {err('expiresAt')}
                  </span>
                )}
              </div>
              <IconButton
                icon="fa-solid fa-trash"
                label={canRemove ? `Quitar lote ${index + 1}` : 'Debe existir al menos un lote'}
                tone="plain"
                disabled={!canRemove}
                className="sm:mt-5 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => form.removeLot(lot.id)}
                {...t(`catalog.product-form.lots.remove.${index + 1}`)}
              />
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-brand hover:text-brand hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-colors flex items-center justify-center gap-2"
        onClick={form.addLot}
        {...t('catalog.product-form.lots.add')}
      >
        <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" /> Agregar otro lote
      </button>
    </section>
  )
}
