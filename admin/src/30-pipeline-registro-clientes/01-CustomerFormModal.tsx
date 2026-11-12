import { Checkbox, Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Select, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useCustomerForm } from './02-useCustomerForm'

const t = tracer('CustomerFormModal', 'src/features/customers/components/CustomerFormModal.tsx')

/** Ficha del cliente: identificación, contacto, ubicación y notas internas. */
export function CustomerFormModal() {
  const f = useCustomerForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,580px)]" className="max-h-[92vh]" {...t('customers.form')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('customers.form.close')}>
        <ModalTitle icon={f.isEdit ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'}>{f.title}</ModalTitle>
      </ModalHeader>

      <form noValidate onSubmit={f.onSubmit} className="p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar" {...t('customers.form.form')}>
        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-3">
          <Field label="Tipo" variant="caps">
            <Select options={f.typeOptions} className="w-full" {...f.bind('type')} {...t('customers.form.type')} />
          </Field>
          <Field label={f.labels.name} variant="caps" required error={f.errors.name}>
            <Input placeholder={f.labels.namePlaceholder} invalid={Boolean(f.errors.name)} autoFocus {...f.bind('name')} {...t('customers.form.name')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Teléfono / WhatsApp" variant="caps" required error={f.errors.phone}>
            <Input type="tel" placeholder="7038-8225" invalid={Boolean(f.errors.phone)} {...f.bind('phone')} {...t('customers.form.phone')} />
          </Field>
          <Field label="Correo" variant="caps" error={f.errors.email}>
            <Input type="email" placeholder="cliente@correo.com" invalid={Boolean(f.errors.email)} {...f.bind('email')} {...t('customers.form.email')} />
          </Field>
          <Field label={f.labels.document} variant="caps" error={f.errors.documentId} hint="Opcional. Para facturación.">
            <Input placeholder={f.labels.documentPlaceholder} className="font-mono" invalid={Boolean(f.errors.documentId)} {...f.bind('documentId')} {...t('customers.form.document')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
          <Field label="Municipio / Ciudad" variant="caps">
            <Input {...f.bind('city')} {...t('customers.form.city')} />
          </Field>
          <Field label="Dirección" variant="caps">
            <Input placeholder="Barrio, calle, número…" {...f.bind('address')} {...t('customers.form.address')} />
          </Field>
        </div>

        <Field label="Notas internas" variant="caps" hint="Solo las ve el equipo (preferencias, acuerdos de pago, contacto…).">
          <Textarea className="h-20" {...f.bind('notes')} {...t('customers.form.notes')} />
        </Field>

        <Checkbox label="Cliente activo (disponible para nuevos pedidos)" {...f.bindCheck('active')} {...t('customers.form.active')} />

        <FormActions
          onCancel={f.onClose}
          submitLabel={f.isEdit ? 'Guardar cambios' : 'Registrar cliente'}
          isLoading={f.isLoading}
          cancelMeta={t('customers.form.cancel')}
          submitMeta={t('customers.form.submit')}
        />
      </form>
    </Modal>
  )
}
