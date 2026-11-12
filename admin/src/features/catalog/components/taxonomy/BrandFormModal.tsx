import { Field, FormActions, Input, Modal, ModalHeader, ModalTitle, SwitchField, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useBrandForm } from '../../hooks/useBrandForm'

const t = tracer('BrandFormModal', 'src/features/catalog/components/taxonomy/BrandFormModal.tsx')

/** Alta/edición de marca. Renombrar actualiza la marca en sus productos (se avisa antes). */
export function BrandFormModal() {
  const f = useBrandForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,460px)]" {...t('catalog.brand-form')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('catalog.brand-form.close')}>
        <ModalTitle icon={f.isEdit ? 'fa-solid fa-pen' : 'fa-solid fa-copyright'}>{f.isEdit ? 'Editar marca' : 'Nueva marca'}</ModalTitle>
      </ModalHeader>

      <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-3.5 text-xs" {...t('catalog.brand-form.form')}>
        <Field label="Nombre" variant="caps" required error={f.errors.name}>
          <Input autoFocus maxLength={40} placeholder="Ej. Lenovo" invalid={Boolean(f.errors.name)} {...f.bind('name')} {...t('catalog.brand-form.name')} />
        </Field>
        {f.renameNotice && (
          <p role="status" className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
            <i className="fa-solid fa-circle-info mt-0.5" aria-hidden="true" /> {f.renameNotice}
          </p>
        )}
        <Field label="Sitio web" variant="caps" hint="Opcional" error={f.errors.website}>
          <Input type="url" placeholder="https://www.lenovo.com" invalid={Boolean(f.errors.website)} {...f.bind('website')} {...t('catalog.brand-form.website')} />
        </Field>
        <Field label="Descripción" variant="caps" hint="Opcional · uso interno" error={f.errors.description}>
          <Textarea maxLength={160} placeholder="Ej. Laptops ThinkPad y IdeaPad" invalid={Boolean(f.errors.description)} {...f.bind('description')} {...t('catalog.brand-form.description')} />
        </Field>
        <SwitchField
          title="Marca activa"
          icon="fa-solid fa-circle-check text-emerald-500"
          description={f.active ? 'Se ofrece al crear o editar productos.' : 'No se ofrece en productos nuevos; los existentes la conservan.'}
          {...f.bindCheck('active')}
          {...t('catalog.brand-form.active')}
        />

        <FormActions
          onCancel={f.onClose}
          submitLabel={f.isEdit ? 'Guardar cambios' : 'Crear marca'}
          isLoading={f.isLoading}
          cancelMeta={t('catalog.brand-form.cancel')}
          submitMeta={t('catalog.brand-form.submit')}
        />
      </form>
    </Modal>
  )
}
