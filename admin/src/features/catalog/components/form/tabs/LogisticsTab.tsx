import { AffixInput, Badge, Field, SwitchField } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ProductFormApi } from '../../../hooks/useProductForm'
import { StockBadge } from '../../StockBadge'
import { LotRowsEditor } from './LotRowsEditor'

const t = tracer('LogisticsTab', 'src/features/catalog/components/form/tabs/LogisticsTab.tsx')

/**
 * Sección 4 · Inventario.
 * - Modo manual: el stock se escribe directamente.
 * - Modo lotes: el stock es de solo lectura y se calcula con la suma de lotes.
 * Una vista previa muestra el badge que verá el equipo en el catálogo.
 */
export function LogisticsTab({ api }: { api: ProductFormApi }) {
  const { form, errors, computedStock } = api
  const { values, bind } = form
  const stock = values.lotControl ? computedStock : Math.max(0, parseInt(values.stock, 10) || 0)
  const reorderPoint = Math.max(0, parseInt(values.reorderPoint, 10) || 0)

  return (
    <div className="space-y-5">
      <SwitchField
        icon="fa-solid fa-layer-group text-brand"
        title="Control de lotes y trazabilidad"
        description="Actívalo para calcular el stock a partir de lotes con número y vencimiento. Desactívalo para registrar existencias manualmente."
        checked={values.lotControl}
        onChange={form.toggleLotControl}
        {...t('catalog.product-form.lot-control')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <Field
          label="Stock actual"
          variant="caps"
          required={!values.lotControl}
          error={errors.stock}
          hint={values.lotControl ? 'Suma de los lotes registrados.' : 'Existencias físicas en sala y bodega.'}
          aside={
            <Badge tone={values.lotControl ? 'brand' : 'neutral'} shape="full">
              {values.lotControl ? 'Autocalculado' : 'Manual'}
            </Badge>
          }
        >
          {values.lotControl ? (
            <AffixInput suffix="unid." tone="readonly" readOnly value={String(computedStock)} {...t('catalog.product-form.stock')} />
          ) : (
            <AffixInput
              suffix="unid."
              type="number"
              min="0"
              inputMode="numeric"
              invalid={Boolean(errors.stock)}
              {...bind('stock')}
              {...t('catalog.product-form.stock')}
            />
          )}
        </Field>
        <Field
          label="Punto de reorden"
          variant="caps"
          required
          error={errors.reorderPoint}
          hint="Con esta cantidad o menos, el producto se marca como stock crítico."
        >
          <AffixInput
            suffix="unid."
            type="number"
            min="0"
            inputMode="numeric"
            invalid={Boolean(errors.reorderPoint)}
            {...bind('reorderPoint')}
            {...t('catalog.product-form.reorder-point')}
          />
        </Field>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Estado resultante
          </span>
          <StockBadge stock={stock} active={values.active} reorderPoint={reorderPoint} />
          <p className="mt-1.5 text-[10px] text-slate-400">Así se verá en el catálogo al guardar.</p>
        </div>
      </div>

      {values.lotControl && <LotRowsEditor api={api} />}
    </div>
  )
}
