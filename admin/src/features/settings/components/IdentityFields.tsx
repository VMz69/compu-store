import { Field, Input, Select, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { IdentityFormApi } from '../hooks/useIdentityForm'

const t = tracer('IdentityFields', 'src/features/settings/components/IdentityFields.tsx')

const SECTION = 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400'
const HINT = 'text-[11px] text-slate-400'

type FieldsProps = { f: IdentityFormApi }

/** Encabezado de cotizaciones y facturas: cómo te contacta el cliente. */
export function CommercialFields({ f }: FieldsProps) {
  const { bind, errors: e } = f
  return (
    <section className="space-y-3" {...t('settings.identity.commercial')}>
      <div>
        <h4 className={SECTION}>1 · Datos comerciales</h4>
        <p className={HINT}>Encabezado de cotizaciones y facturas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre comercial" variant="caps" required error={e.name}>
          <Input tone="muted" maxLength={60} invalid={Boolean(e.name)} {...bind('name')} {...t('settings.identity.name')} />
        </Field>
        <Field label="Correo institucional" variant="caps" required error={e.email}>
          <Input tone="muted" type="email" invalid={Boolean(e.email)} {...bind('email')} {...t('settings.identity.email')} />
        </Field>
        <Field label="Teléfono principal (WhatsApp)" variant="caps" required error={e.phone}>
          <Input tone="muted" type="tel" invalid={Boolean(e.phone)} {...bind('phone')} {...t('settings.identity.phone')} />
        </Field>
        <Field label="Teléfono secundario" variant="caps" hint="Opcional" error={e.phone2}>
          <Input tone="muted" type="tel" invalid={Boolean(e.phone2)} {...bind('phone2')} {...t('settings.identity.phone2')} />
        </Field>
      </div>
      <Field label="Dirección de la sucursal" variant="caps" required error={e.address}>
        <Textarea tone="muted" className="h-16" maxLength={200} invalid={Boolean(e.address)} {...bind('address')} {...t('settings.identity.address')} />
      </Field>
    </section>
  )
}

/** Bloque "Datos del emisor" de la factura (DTE): datos ante Hacienda. */
export function TaxpayerFields({ f }: FieldsProps) {
  const { bind, errors: e } = f
  return (
    <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800" {...t('settings.identity.taxpayer')}>
      <div>
        <h4 className={SECTION}>2 · Datos del contribuyente</h4>
        <p className={HINT}>Obligatorios en la factura electrónica (DTE). Deben coincidir con tu registro en Hacienda.</p>
      </div>
      <Field label="Razón social" variant="caps" required error={e.legalName}>
        <Input tone="muted" maxLength={100} placeholder="Ej. COMPU STORE SAS DE CV" invalid={Boolean(e.legalName)} {...bind('legalName')} {...t('settings.identity.legal-name')} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="NIT" variant="caps" required error={e.nit}>
          <Input tone="muted" inputMode="numeric" placeholder="0614-250318-102-3" invalid={Boolean(e.nit)} {...bind('nit')} {...t('settings.identity.nit')} />
        </Field>
        <Field label="NRC" variant="caps" required error={e.nrc}>
          <Input tone="muted" placeholder="367628-0" invalid={Boolean(e.nrc)} {...bind('nrc')} {...t('settings.identity.nrc')} />
        </Field>
        <Field label="Tipo de establecimiento" variant="caps" required error={e.establishmentType}>
          <Select tone="muted" options={f.establishmentOptions} className="w-full" {...bind('establishmentType')} {...t('settings.identity.establishment')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Actividad económica (giro)" variant="caps" required error={e.economicActivity} className="md:col-span-2">
          <Input tone="muted" maxLength={120} invalid={Boolean(e.economicActivity)} {...bind('economicActivity')} {...t('settings.identity.activity')} />
        </Field>
        <Field label="IVA" variant="caps" hint="Normativa nacional · no editable">
          <Input tone="readonly" disabled value={`${f.taxPercent}% incluido en precios`} {...t('settings.identity.tax')} />
        </Field>
      </div>
    </section>
  )
}

/** Semilla del correlativo de facturas: desde qué número continúa la numeración. */
export function InvoiceNumberingFields({ f }: FieldsProps) {
  const { bind, errors: e, invoicing } = f
  return (
    <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800" {...t('settings.identity.invoicing')}>
      <div>
        <h4 className={SECTION}>3 · Numeración de facturas</h4>
        <p className={HINT}>Correlativo interno de la factura. Déjalo vacío para continuar la secuencia actual.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <Field label="Próximo número de factura" variant="caps" error={e.invoiceSeed} hint="Opcional · solo puede adelantar la numeración">
          <Input tone="muted" inputMode="numeric" maxLength={6} placeholder={invoicing.next ?? 'Ej. 015800'} invalid={Boolean(e.invoiceSeed)} {...bind('invoiceSeed')} {...t('settings.identity.invoice-seed')} />
        </Field>
        <dl className="md:col-span-2 grid grid-cols-2 gap-3 text-xs" aria-live="polite">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último emitido</dt>
            <dd className="font-black font-mono text-slate-700 dark:text-slate-200">{invoicing.lastIssued ?? '—'}</dd>
          </div>
          <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand/10 border border-brand/20">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próxima factura</dt>
            <dd className="font-black font-mono text-brand">{invoicing.next ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
