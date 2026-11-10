import { Checkbox, Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useUserForm } from '../../hooks/useUserForm'
import { NewPasswordFields } from '../password/NewPasswordFields'

const t = tracer('UserFormModal', 'src/features/access/components/users/UserFormModal.tsx')

/** Alta/edición de usuario. En edición no se muestra la contraseña (se usa "Restablecer"). */
export function UserFormModal() {
  const f = useUserForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,560px)]" className="max-h-[92vh]" {...t('access.user-form')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('access.user-form.close')}>
        <ModalTitle icon={f.isEdit ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'}>{f.title}</ModalTitle>
      </ModalHeader>

      <form noValidate onSubmit={f.onSubmit} className="p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar" {...t('access.user-form.form')}>
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Datos del colaborador</legend>
          <Field label="Nombre completo" variant="caps" required error={f.errors.name}>
            <Input placeholder="Ej. Licda. Karen Martínez" invalid={Boolean(f.errors.name)} autoFocus {...f.bind('name')} {...t('access.user-form.name')} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Correo (usuario de acceso)" variant="caps" required error={f.errors.email}>
              <Input type="email" autoComplete="off" placeholder="nombre@compustoresv.com" invalid={Boolean(f.errors.email)} {...f.bind('email')} {...t('access.user-form.email')} />
            </Field>
            <Field label="Teléfono" variant="caps" error={f.errors.phone}>
              <Input type="tel" placeholder="Ej. 7038-8225" invalid={Boolean(f.errors.phone)} {...f.bind('phone')} {...t('access.user-form.phone')} />
            </Field>
          </div>
          <Field label="Rol (plantilla de accesos)" variant="caps" required error={f.errors.role} hint="Copia sus vistas y acciones. Cambiar el rol reinicia los accesos; se ajustan en Accesos.">
            <Select options={f.roleOptions} className="w-full" invalid={Boolean(f.errors.role)} {...f.bind('role')} {...t('access.user-form.role')} />
          </Field>
          <div>
            <Checkbox label="Cuenta activa (puede iniciar sesión)" {...f.bindCheck('active')} {...t('access.user-form.active')} />
            {f.errors.active && <p role="alert" className="mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">{f.errors.active}</p>}
          </div>
        </fieldset>

        {!f.isEdit && (
          <fieldset className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <legend className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Contraseña inicial</legend>
            <NewPasswordFields
              bind={f.bind}
              errors={f.errors}
              policy={f.policy}
              visible={f.passwordVisible}
              onToggleVisible={f.togglePasswordVisible}
              onGenerate={f.generate}
              traceId="access.user-form"
            />
            <Checkbox label="Solicitar cambio de contraseña en el primer inicio de sesión" {...f.bindCheck('mustChangePassword')} {...t('access.user-form.must-change')} />
          </fieldset>
        )}

        <FormActions
          onCancel={f.onClose}
          submitLabel={f.isEdit ? 'Guardar cambios' : 'Crear usuario'}
          isLoading={f.isLoading}
          cancelMeta={t('access.user-form.cancel')}
          submitMeta={t('access.user-form.submit')}
        />
      </form>
    </Modal>
  )
}
