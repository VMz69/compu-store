import type { StoreSettings } from '@/85-pipeline-identificadores-texto/03-store.config'
import { Card, CardTitle } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'

const t = tracer('TaxpayerCard', 'src/features/settings/components/TaxpayerCard.tsx')

/** Datos del contribuyente emisor que se imprimen en cada factura (solo lectura). */
export function TaxpayerCard({ settings }: { settings: StoreSettings }) {
  const rows: Array<[string, string]> = [
    ['Razón social', settings.legalName],
    ['NIT', settings.nit],
    ['NRC', settings.nrc],
    ['Actividad económica', settings.economicActivity],
    ['Tipo de establecimiento', settings.establishmentType],
  ]

  return (
    <Card className="p-5 md:col-span-2 xl:col-span-1" {...t('settings.fiscal.taxpayer')}>
      <CardTitle className="flex items-center gap-2 mb-3">
        <i className="fa-solid fa-id-card text-brand" aria-hidden="true" /> Datos del contribuyente emisor
      </CardTitle>
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-6 gap-y-2.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd className="font-bold text-slate-700 dark:text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[10px] text-slate-400">Se imprimen en el bloque "Datos del emisor" de cada factura.</p>
    </Card>
  )
}
