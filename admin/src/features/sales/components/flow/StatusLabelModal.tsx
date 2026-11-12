import { Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useStatusLabelForm } from '../../hooks/useFlowTable'

const t = tracer('StatusLabelModal', 'src/features/sales/components/flow/StatusLabelModal.tsx')

/** Edita el nombre visible y la descripción de un estado (las reglas del flujo no cambian). */
export function StatusLabelModal() {
  const f = useStatusLabelForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,440px)]" {...t('settings.status-label')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('settings.status-label.close')}>
        <ModalTitle icon={`fa-solid ${f.status.icon}`}>Editar estado</ModalTitle>
      </ModalHeader>
      <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-3.5 text-xs" {...t('settings.status-label.form')}>
        <Field label="Nombre visible" variant="caps" required error={f.errors.name}>
          <Input autoFocus maxLength={30} invalid={Boolean(f.errors.name)} {...f.bind('name')} {...t('settings.status-label.name')} />
        </Field>
        <Field label="Descripción" variant="caps" error={f.errors.description}>
          <Textarea className="h-20" maxLength={200} invalid={Boolean(f.errors.description)} {...f.bind('description')} {...t('settings.status-label.description')} />
        </Field>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <i className="fa-solid fa-lock mr-1" aria-hidden="true" />
          Solo cambia el texto que ve el equipo. El orden, las transiciones y sus efectos (reserva de stock, facturación) son fijos.
        </p>
        <FormActions onCancel={f.onClose} submitLabel="Guardar" cancelMeta={t('settings.status-label.cancel')} submitMeta={t('settings.status-label.submit')} />
      </form>
    </Modal>
  )
}
