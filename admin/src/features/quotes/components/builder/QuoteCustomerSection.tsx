import { cn } from '@/shared/lib/cn'
import { Field, Input, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { QuoteBuilderApi } from '../../hooks/useQuoteBuilder'

const t = tracer('QuoteCustomerSection', 'src/features/quotes/components/builder/QuoteCustomerSection.tsx')

const MODE_BASE = 'flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors'
const MODE_ACTIVE = 'bg-white dark:bg-slate-700 text-brand shadow-xs'
const MODE_IDLE = 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'

/** Paso 1 · Cliente: del directorio o cliente ocasional (datos a mano). */
export function QuoteCustomerSection({ b }: { b: QuoteBuilderApi }) {
  const isDirectory = b.mode === 'directory'

  return (
    <section className="space-y-3" {...t('quotes.builder.customer')}>
      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">1 · Cliente</h3>
      <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" role="group" aria-label="Origen del cliente">
        <button type="button" aria-pressed={isDirectory} className={cn(MODE_BASE, isDirectory ? MODE_ACTIVE : MODE_IDLE)} onClick={b.setDirectoryMode} {...t('quotes.builder.customer.directory')}>
          <i className="fa-solid fa-address-book mr-1" aria-hidden="true" /> Del directorio
        </button>
        <button type="button" aria-pressed={!isDirectory} className={cn(MODE_BASE, !isDirectory ? MODE_ACTIVE : MODE_IDLE)} onClick={b.setWalkinMode} {...t('quotes.builder.customer.walkin')}>
          <i className="fa-solid fa-user-clock mr-1" aria-hidden="true" /> Cliente ocasional
        </button>
      </div>

      {isDirectory ? (
        <>
          <Field label="Cliente" variant="caps" required error={b.errors.customer}>
            <Select options={b.customerOptions} className="w-full" invalid={Boolean(b.errors.customer)} {...b.bind('customerId')} {...t('quotes.builder.customer.select')} />
          </Field>
          {b.selectedCustomer && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {b.selectedCustomer.email || 'Sin correo'}
              {b.selectedCustomer.documentId && ` · ${b.selectedCustomer.type === 'empresa' ? 'NIT' : 'DUI'} ${b.selectedCustomer.documentId}`}
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre o razón social" variant="caps" required error={b.errors.name} className="sm:col-span-2">
            <Input placeholder="Ej. Colegio San José" invalid={Boolean(b.errors.name)} {...b.bind('name')} {...t('quotes.builder.customer.name')} />
          </Field>
          <Field label="Teléfono" variant="caps" required error={b.errors.phone}>
            <Input type="tel" placeholder="7038-8225" invalid={Boolean(b.errors.phone)} {...b.bind('phone')} {...t('quotes.builder.customer.phone')} />
          </Field>
          <Field label="Correo" variant="caps">
            <Input type="email" placeholder="Opcional" {...b.bind('email')} {...t('quotes.builder.customer.email')} />
          </Field>
        </div>
      )}
    </section>
  )
}
