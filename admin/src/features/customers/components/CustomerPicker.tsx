import { useId } from 'react'
import { cn } from '@/shared/lib/cn'
import { Field, Input } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useCustomerCombobox } from '../hooks/useCustomerCombobox'
import type { CustomerSelection } from '../hooks/useCustomerSelection'
import { CustomerSearch } from './picker/CustomerSearch'
import { SelectedCustomerCard } from './picker/SelectedCustomerCard'

const t = tracer('CustomerPicker', 'src/features/customers/components/CustomerPicker.tsx')

const MODE_BASE = 'flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors'
const MODE_ACTIVE = 'bg-white dark:bg-slate-700 text-brand shadow-xs'
const MODE_IDLE = 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'

interface CustomerPickerProps {
  selection: CustomerSelection
  errors: Record<string, string | undefined>
  title: string
  /** Prefijo de trazabilidad (ej. "quotes.builder.customer"). */
  traceId: string
}

/** Cliente de un documento comercial: del directorio o cliente ocasional (datos a mano). */
export function CustomerPicker({ selection: s, errors, title, traceId }: CustomerPickerProps) {
  const isDirectory = s.mode === 'directory'
  const cb = useCustomerCombobox(s)
  const inputId = useId()

  return (
    <section className="space-y-3" {...t(traceId)}>
      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" role="group" aria-label="Origen del cliente">
        <button type="button" aria-pressed={isDirectory} className={cn(MODE_BASE, isDirectory ? MODE_ACTIVE : MODE_IDLE)} onClick={s.setDirectoryMode} {...t(`${traceId}.directory`)}>
          <i className="fa-solid fa-address-book mr-1" aria-hidden="true" /> Del directorio
        </button>
        <button type="button" aria-pressed={!isDirectory} className={cn(MODE_BASE, !isDirectory ? MODE_ACTIVE : MODE_IDLE)} onClick={s.setWalkinMode} {...t(`${traceId}.walkin`)}>
          <i className="fa-solid fa-user-clock mr-1" aria-hidden="true" /> Cliente ocasional
        </button>
      </div>

      {isDirectory ? (
        <div className="space-y-1">
          <label htmlFor={inputId} className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Cliente<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          {s.selected ? (
            <SelectedCustomerCard customer={s.selected} traceId={traceId} onChange={cb.change} />
          ) : (
            <CustomerSearch cb={cb} invalid={Boolean(errors.customer)} traceId={traceId} inputId={inputId} />
          )}
          {errors.customer && !s.selected && (
            <p role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <i className="fa-solid fa-circle-exclamation text-[9px]" aria-hidden="true" /> {errors.customer}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre o razón social" variant="caps" required error={errors.name} className="sm:col-span-2">
            <Input placeholder="Ej. Colegio San José" invalid={Boolean(errors.name)} {...s.bind('name')} {...t(`${traceId}.name`)} />
          </Field>
          <Field label="Teléfono" variant="caps" required error={errors.phone}>
            <Input type="tel" placeholder="7038-8225" invalid={Boolean(errors.phone)} {...s.bind('phone')} {...t(`${traceId}.phone`)} />
          </Field>
          <Field label="Correo" variant="caps">
            <Input type="email" placeholder="Opcional" {...s.bind('email')} {...t(`${traceId}.email`)} />
          </Field>
        </div>
      )}
    </section>
  )
}
