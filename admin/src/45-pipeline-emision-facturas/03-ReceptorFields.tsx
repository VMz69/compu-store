import { Checkbox, Field, Input, Select } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { InvoiceEmitApi } from './02-useInvoiceEmit'

const t = tracer('ReceptorFields', 'src/45-pipeline-emision-facturas/03-ReceptorFields.tsx')

/** Datos del receptor: "Consumidor Final" o identificado (precargado del directorio si hay coincidencia). */
export function ReceptorFields({ f }: { f: InvoiceEmitApi }) {
  return (
    <section className="space-y-3" {...t('billing.emit.receptor')}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Receptor</h4>
        {f.matchedCustomer && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <i className="fa-solid fa-address-book mr-1" aria-hidden="true" /> Datos del directorio
          </span>
        )}
      </div>

      <Checkbox label="Emitir a Consumidor Final (sin identificar al cliente)" {...f.bindCheck('isFinalConsumer')} {...t('billing.emit.final-consumer')} />

      {!f.isFinalConsumer && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre o razón social" variant="caps" required error={f.errors.name}>
            <Input invalid={Boolean(f.errors.name)} {...f.bind('name')} {...t('billing.emit.name')} />
          </Field>
          <Field label="DUI / NIT" variant="caps" hint="Opcional en Factura de Consumidor Final.">
            <Input className="font-mono" {...f.bind('documentId')} {...t('billing.emit.document')} />
          </Field>
          <Field label="Dirección" variant="caps">
            <Input {...f.bind('address')} {...t('billing.emit.address')} />
          </Field>
          <Field label="Correo" variant="caps">
            <Input type="email" {...f.bind('email')} {...t('billing.emit.email')} />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Condición de pago" variant="caps">
          <Select options={f.paymentOptions} className="w-full" {...f.bind('paymentCondition')} {...t('billing.emit.payment')} />
        </Field>
        <Field label="Observaciones" variant="caps">
          <Input placeholder="Opcional (aparece en la factura)" {...f.bind('notes')} {...t('billing.emit.notes')} />
        </Field>
      </div>
    </section>
  )
}
