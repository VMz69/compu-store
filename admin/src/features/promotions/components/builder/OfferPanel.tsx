import { cn } from '@/shared/lib/cn'
import { AffixInput, Button, Field, Input, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OfferBuilderApi } from '../../hooks/useOfferBuilder'
import { OfferProductList } from './OfferProductList'

const t = tracer('OfferPanel', 'src/features/promotions/components/builder/OfferPanel.tsx')

const STEP = 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400'
const SEG = 'flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors'

/** Panel derecho del constructor: datos → descuento y vigencia → productos → resumen y guardar. */
export function OfferPanel({ b }: { b: OfferBuilderApi }) {
  const s = b.summary
  return (
    <aside className="flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm" aria-label="Datos de la oferta" {...t('promotions.builder.panel')}>
      <fieldset disabled={b.readOnly} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <section className="space-y-3">
          <h3 className={STEP}>1 · Oferta</h3>
          <Field label="Nombre" variant="caps" required error={b.errors.title}>
            <Input maxLength={60} placeholder="Ej. Black Friday laptops" invalid={Boolean(b.errors.title)} {...b.bind('title')} {...t('promotions.builder.title')} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Etiqueta del banner" variant="caps"><Input maxLength={30} {...b.bind('badge')} {...t('promotions.builder.badge')} /></Field>
            <Field label="Descripción" variant="caps"><Textarea className="h-8" maxLength={120} placeholder="Opcional" {...b.bind('description')} {...t('promotions.builder.description')} /></Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className={STEP}>2 · Descuento y vigencia</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" role="group" aria-label="Tipo de descuento">
                {(['percent', 'amount'] as const).map((type) => (
                  <button key={type} type="button" aria-pressed={b.discountType === type} onClick={() => b.setDiscountType(type)} className={cn(SEG, b.discountType === type ? 'bg-white dark:bg-slate-700 text-brand shadow-xs' : 'text-slate-500')} {...t(`promotions.builder.type.${type}`)}>
                    {type === 'percent' ? 'Porcentaje' : 'Monto fijo'}
                  </button>
                ))}
              </div>
              <AffixInput aria-label="Valor del descuento" inputMode="decimal" prefix={b.discountType === 'amount' ? '$' : undefined} suffix={b.discountType === 'percent' ? '%' : undefined} invalid={Boolean(b.errors.discountValue)} {...b.bind('discountValue')} {...t('promotions.builder.value')} />
              {b.errors.discountValue && <p role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400">{b.errors.discountValue}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde" variant="caps"><Input type="date" invalid={Boolean(b.errors.dates)} {...b.bind('startDate')} {...t('promotions.builder.start')} /></Field>
              <Field label="Hasta" variant="caps"><Input type="date" invalid={Boolean(b.errors.dates)} {...b.bind('endDate')} {...t('promotions.builder.end')} /></Field>
              {b.errors.dates && <p role="alert" className="col-span-2 text-[10px] font-semibold text-red-600 dark:text-red-400">{b.errors.dates}</p>}
            </div>
          </div>
        </section>

        <OfferProductList b={b} />
      </fieldset>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl space-y-3">
        <dl className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
          <div><dt className="text-[10px] text-slate-400">Productos</dt><dd className="text-sm font-black text-slate-800 dark:text-slate-100">{s.count}</dd></div>
          <div><dt className="text-[10px] text-slate-400">Ahorro prom.</dt><dd className="text-sm font-black text-brand">{s.avgSaving.toFixed(1)}%</dd></div>
          <div>
            <dt className="text-[10px] text-slate-400">Margen mín.</dt>
            <dd className={cn('text-sm font-black', s.belowCount ? 'text-red-600' : s.lowCount ? 'text-amber-600' : 'text-emerald-600')}>{s.minMargin === null ? '—' : `${s.minMargin.toFixed(1)}%`}</dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={b.cancel} {...t('promotions.builder.cancel')}>{b.readOnly ? 'Volver' : 'Cancelar'}</Button>
          {!b.readOnly && (
            <Button size="md" icon="fa-solid fa-floppy-disk" className="flex-1" isLoading={b.isLoading} onClick={b.submit} {...t('promotions.builder.save')}>
              {b.isEdit ? 'Guardar cambios' : 'Crear oferta'}
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
