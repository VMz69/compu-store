import { AffixInput, Field, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductFormApi } from '../../../hooks/useProductForm'
import { CommercialSummary } from './CommercialSummary'

const t = tracer('PricingTab', 'src/features/catalog/components/form/tabs/PricingTab.tsx')

/**
 * Sección 2 · Precios y costos.
 * El descuento no se captura: se deriva de "Precio anterior" vs "Precio de venta"
 * y se muestra en el resumen, para que ambos datos nunca se contradigan.
 */
export function PricingTab({ api }: { api: ProductFormApi }) {
  const { form, errors, summary } = api
  const { bind } = form

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Costo unitario" variant="caps" error={errors.cost} hint="Sin IVA. Uso interno.">
          <AffixInput
            prefix="$"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            invalid={Boolean(errors.cost)}
            {...bind('cost')}
            {...t('catalog.product-form.cost')}
          />
        </Field>
        <Field label="Precio de venta" variant="caps" required error={errors.price} hint="IVA incluido.">
          <AffixInput
            prefix="$"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            invalid={Boolean(errors.price)}
            {...bind('price')}
            {...t('catalog.product-form.price')}
          />
        </Field>
        <Field label="Precio anterior" variant="caps" error={errors.originalPrice} hint="Opcional. Se muestra tachado.">
          <AffixInput
            prefix="$"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            invalid={Boolean(errors.originalPrice)}
            {...bind('originalPrice')}
            {...t('catalog.product-form.original-price')}
          />
        </Field>
        <Field label="IVA" variant="caps" error={errors.taxRate} hint="13 % en El Salvador.">
          <AffixInput
            suffix="%"
            type="number"
            step="0.01"
            min="0"
            max="100"
            inputMode="decimal"
            invalid={Boolean(errors.taxRate)}
            {...bind('taxRate')}
            {...t('catalog.product-form.tax')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-5">
        <Field label="Descripción comercial" variant="caps" hint="Visible para los clientes en la tienda web.">
          <Textarea
            className="h-36"
            placeholder="Beneficios, uso recomendado, garantía…"
            {...bind('description')}
            {...t('catalog.product-form.description')}
          />
        </Field>
        <CommercialSummary summary={summary} />
      </div>
    </div>
  )
}
