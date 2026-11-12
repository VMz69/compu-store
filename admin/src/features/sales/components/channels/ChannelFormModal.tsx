import { cn } from '@/shared/lib/cn'
import { Checkbox, Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useChannelForm } from '../../hooks/useChannelForm'

const t = tracer('ChannelFormModal', 'src/features/sales/components/channels/ChannelFormModal.tsx')

/** Alta/edición de canal de venta. */
export function ChannelFormModal() {
  const f = useChannelForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,480px)]" {...t('settings.channel-form')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('settings.channel-form.close')}>
        <ModalTitle icon="fa-solid fa-diagram-project">{f.isEdit ? 'Editar canal' : 'Nuevo canal'}</ModalTitle>
      </ModalHeader>

      <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-3.5 text-xs" {...t('settings.channel-form.form')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre" variant="caps" required error={f.errors.name}>
            <Input autoFocus maxLength={40} placeholder="Ej. TikTok Shop" invalid={Boolean(f.errors.name)} {...f.bind('name')} {...t('settings.channel-form.name')} />
          </Field>
          <Field label="Etiqueta" variant="caps" hint="Ej. Redes sociales">
            <Input maxLength={24} {...f.bind('badge')} {...t('settings.channel-form.badge')} />
          </Field>
        </div>
        {f.renameNotice && (
          <p role="status" className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
            <i className="fa-solid fa-circle-info mr-1.5" aria-hidden="true" />{f.renameNotice}
          </p>
        )}
        <fieldset>
          <legend className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ícono</legend>
          <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Ícono del canal">
            {f.icons.map((icon) => (
              <button
                key={icon.value}
                type="button"
                role="radio"
                aria-checked={f.icon === icon.value}
                aria-label={icon.label}
                title={icon.label}
                onClick={() => f.selectIcon(icon.value)}
                className={cn('aspect-square rounded-lg border flex items-center justify-center text-sm transition-colors', f.icon === icon.value ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-brand')}
                {...t(`settings.channel-form.icon.${icon.label}`)}
              >
                <i className={icon.value} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="Descripción" variant="caps" hint="Opcional" error={f.errors.description}>
          <Textarea className="h-16" maxLength={160} placeholder="¿Cómo opera este canal y quién lo atiende?" invalid={Boolean(f.errors.description)} {...f.bind('description')} {...t('settings.channel-form.description')} />
        </Field>
        <Checkbox label="Activo: disponible al registrar pedidos" {...f.bindCheck('active')} {...t('settings.channel-form.active')} />

        <FormActions
          onCancel={f.onClose}
          submitLabel={f.isEdit ? 'Guardar cambios' : 'Crear canal'}
          isLoading={f.isLoading}
          cancelMeta={t('settings.channel-form.cancel')}
          submitMeta={t('settings.channel-form.submit')}
        />
      </form>
    </Modal>
  )
}
