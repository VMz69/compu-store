import { Checkbox, Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useChannelForm } from '../../hooks/useChannelForm'

const t = tracer('ChannelFormModal', 'src/features/sales/components/channels/ChannelFormModal.tsx')

export function ChannelFormModal() {
  const { bind, bindCheck, title, onSubmit, onClose, isLoading } = useChannelForm()

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,480px)]" {...t('settings.channel-form')}>
      <ModalHeader onClose={onClose} closeMeta={t('settings.channel-form.close')}>
        <ModalTitle icon="fa-solid fa-diagram-project">{title}</ModalTitle>
      </ModalHeader>

      <form onSubmit={onSubmit} className="p-5 space-y-3.5 text-xs" {...t('settings.channel-form.form')}>
        <Field label="Nombre Comercial del Canal *">
          <Input
            required
            placeholder="Ej. TikTok Live Shop, Feria Tecnológica..."
            {...bind('name')}
            {...t('settings.channel-form.name')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Insignia / Badge">
            <Input placeholder="Ej. Redes Sociales" {...bind('badge')} {...t('settings.channel-form.badge')} />
          </Field>
          <Field label="Ícono FontAwesome">
            <Input placeholder="fa-solid fa-store" {...bind('icon')} {...t('settings.channel-form.icon')} />
          </Field>
        </div>
        <Field label="Descripción Operativa">
          <Textarea
            className="h-20"
            placeholder="Describe cómo opera este canal y qué equipo lo atiende..."
            {...bind('description')}
            {...t('settings.channel-form.description')}
          />
        </Field>
        <Checkbox
          label="Habilitar inmediatamente para registro de nuevos pedidos"
          {...bindCheck('active')}
          {...t('settings.channel-form.active')}
        />

        <FormActions
          onCancel={onClose}
          submitLabel="Guardar Canal"
          isLoading={isLoading}
          cancelMeta={t('settings.channel-form.cancel')}
          submitMeta={t('settings.channel-form.submit')}
        />
      </form>
    </Modal>
  )
}
