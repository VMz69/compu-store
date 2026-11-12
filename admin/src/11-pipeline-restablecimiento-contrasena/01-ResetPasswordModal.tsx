import { Checkbox, FormActions, Modal, ModalHeader, ModalTitle } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useResetPasswordForm } from '../10-pipeline-cambio-contrasena/02-usePasswordForms'
import { NewPasswordFields } from '../10-pipeline-cambio-contrasena/03-NewPasswordFields'
import { UserAvatar } from '../08-pipeline-edicion-usuarios/04-UserAvatar'

const t = tracer('ResetPasswordModal', 'src/11-pipeline-restablecimiento-contrasena/01-ResetPasswordModal.tsx')

/** Asigna una contraseña nueva a un usuario (la actual no se puede ver: solo se reemplaza). */
export function ResetPasswordModal() {
  const f = useResetPasswordForm()
  if (!f.target) return null

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,520px)]" {...t('access.reset-password')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('access.reset-password.close')}>
        <ModalTitle icon="fa-solid fa-key">Restablecer contraseña</ModalTitle>
      </ModalHeader>

      <form noValidate onSubmit={f.onSubmit} className="p-5 space-y-4 text-xs" {...t('access.reset-password.form')}>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <UserAvatar name={f.target.name} avatar={f.target.avatar} className="w-9 h-9" />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{f.target.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{f.target.email}</p>
          </div>
        </div>

        <NewPasswordFields
          label="Nueva contraseña"
          bind={f.bind}
          errors={f.errors}
          policy={f.policy}
          visible={f.passwordVisible}
          onToggleVisible={f.togglePasswordVisible}
          onGenerate={f.generate}
          traceId="access.reset-password"
        />

        {f.isSelf ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Estás cambiando tu propia contraseña: se aplicará de inmediato.
          </p>
        ) : (
          <Checkbox
            label="Es temporal: pedir que la cambie en su próximo inicio de sesión"
            {...f.bindCheck('mustChangePassword')}
            {...t('access.reset-password.must-change')}
          />
        )}

        <FormActions
          onCancel={f.onClose}
          submitLabel="Actualizar contraseña"
          isLoading={f.isLoading}
          cancelMeta={t('access.reset-password.cancel')}
          submitMeta={t('access.reset-password.submit')}
        />
      </form>
    </Modal>
  )
}
