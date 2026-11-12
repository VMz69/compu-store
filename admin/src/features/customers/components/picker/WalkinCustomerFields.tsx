import { Field, Input, Select } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { CustomerSelection } from '../../hooks/useCustomerSelection'
import { DuplicateCustomerNotice } from './DuplicateCustomerNotice'

const t = tracer('WalkinCustomerFields', 'src/features/customers/components/picker/WalkinCustomerFields.tsx')

const TYPE_OPTIONS = [
  { value: 'persona', label: 'Persona' },
  { value: 'empresa', label: 'Empresa' },
]

interface WalkinCustomerFieldsProps {
  selection: CustomerSelection
  errors: Record<string, string | undefined>
  traceId: string
}

/**
 * Datos del cliente escritos a mano. Con `registerNew` (pedidos) pide además tipo,
 * DUI/NIT y ciudad, porque el cliente quedará registrado en el directorio.
 */
export function WalkinCustomerFields({ selection: s, errors, traceId }: WalkinCustomerFieldsProps) {
  const doc = s.isCompany ? 'NIT' : 'DUI'
  const phoneError = s.duplicate ? undefined : errors.phone

  return (
    <div className="space-y-3" {...t(`${traceId}.walkinFields`)}>
      {s.registerNew && (
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
          <i className="fa-solid fa-user-plus mt-0.5" aria-hidden="true" />
          <span>Al registrar el pedido, este cliente se agregará al directorio automáticamente.</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {s.registerNew && (
          <Field label="Tipo" variant="caps" required>
            <Select options={TYPE_OPTIONS} className="w-full" {...s.bind('type')} {...t(`${traceId}.type`)} />
          </Field>
        )}
        <Field label={s.isCompany ? 'Razón social' : 'Nombre completo'} variant="caps" required error={errors.name} className={s.registerNew ? '' : 'sm:col-span-2'}>
          <Input placeholder={s.isCompany ? 'Ej. Colegio San José' : 'Ej. María Hernández'} invalid={Boolean(errors.name)} {...s.bind('name')} {...t(`${traceId}.name`)} />
        </Field>
        <Field label="Teléfono" variant="caps" required error={phoneError}>
          <Input type="tel" placeholder="7038-8225" invalid={Boolean(phoneError || s.duplicate)} {...s.bind('phone')} {...t(`${traceId}.phone`)} />
        </Field>
        <Field label="Correo" variant="caps" error={errors.email}>
          <Input type="email" placeholder="Opcional" invalid={Boolean(errors.email)} {...s.bind('email')} {...t(`${traceId}.email`)} />
        </Field>
        {s.registerNew && (
          <>
            <Field label={doc} variant="caps" hint="Opcional" error={errors.documentId}>
              <Input placeholder={s.isCompany ? '0614-250318-102-3' : '01234567-8'} invalid={Boolean(errors.documentId)} {...s.bind('documentId')} {...t(`${traceId}.document`)} />
            </Field>
            <Field label="Ciudad" variant="caps" hint="Opcional">
              <Input placeholder="Cojutepeque" {...s.bind('city')} {...t(`${traceId}.city`)} />
            </Field>
          </>
        )}
      </div>
      {s.duplicate && <DuplicateCustomerNotice customer={s.duplicate} traceId={traceId} onUse={() => s.select(s.duplicate!.id)} />}
    </div>
  )
}
