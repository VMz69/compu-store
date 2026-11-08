import { Badge, Card, CardTitle, Field, Input } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('FiscalCards', 'src/features/settings/components/FiscalCards.tsx')

/** Parámetros fiscales de solo lectura (normativa salvadoreña). */
export function FiscalCards({ currency }: { currency: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl" {...t('settings.fiscal')}>
      <Card className="p-5 space-y-3.5" {...t('settings.fiscal.currency')}>
        <CardTitle className="flex items-center gap-2">
          <i className="fa-solid fa-dollar-sign text-emerald-500" aria-hidden="true" /> Régimen Monetario
        </CardTitle>
        <Field
          label="Moneda Base Operativa"
          variant="caps"
          hint="Moneda de curso legal según Ley de Integración Monetaria de El Salvador."
        >
          <Input tone="readonly" disabled value={`${currency} - Dólar Estadounidense ($)`} />
        </Field>
        <Field label="Formato de Precios" variant="caps">
          <Input tone="readonly" disabled value="2 Decimales con símbolo USD ($0.00)" />
        </Field>
      </Card>

      <Card className="p-5 space-y-3.5" {...t('settings.fiscal.tax')}>
        <CardTitle className="flex items-center gap-2">
          <i className="fa-solid fa-receipt text-brand" aria-hidden="true" /> Impuesto al Valor Agregado (IVA)
        </CardTitle>
        <Field
          label="Alícuota Nacional IVA"
          variant="caps"
          hint="Todos los precios de catálogo a consumidor final incluyen el 13% de IVA."
        >
          <Input tone="readonly" disabled value="13% (El Salvador)" />
        </Field>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Documentos Tributarios Emitidos
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge tone="brand" shape="sm">Factura Electrónica (DTE)</Badge>
            <Badge tone="purple" shape="sm">Crédito Fiscal (CCF)</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
