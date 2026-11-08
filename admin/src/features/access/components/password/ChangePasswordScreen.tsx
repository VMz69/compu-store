import { Button } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useChangePasswordForm } from '../../hooks/usePasswordForms'
import { NewPasswordFields } from './NewPasswordFields'

const t = tracer('ChangePasswordScreen', 'src/features/access/components/password/ChangePasswordScreen.tsx')

/**
 * Pantalla bloqueante: el usuario tiene una contraseña temporal y debe
 * definir la suya antes de usar el panel. Se muestra desde el guard de rutas.
 */
export function ChangePasswordScreen() {
  const f = useChangePasswordForm()

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto animate-fade-in" {...t('access.change-password')}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-800 p-7 w-[min(94vw,520px)]">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-key" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Define tu contraseña</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hola {f.user?.name}. Tu cuenta tiene una contraseña temporal; crea una propia para continuar.
            </p>
          </div>
        </div>

        <form noValidate onSubmit={f.onSubmit} className="space-y-5 text-xs" {...t('access.change-password.form')}>
          <NewPasswordFields
            label="Nueva contraseña"
            bind={f.bind}
            errors={f.errors}
            policy={f.policy}
            visible={f.passwordVisible}
            onToggleVisible={f.togglePasswordVisible}
            traceId="access.change-password"
          />
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" icon="fa-solid fa-arrow-right-from-bracket" onClick={f.logout} {...t('access.change-password.logout')}>
              Salir
            </Button>
            <Button type="submit" size="md" isLoading={f.isLoading} {...t('access.change-password.submit')}>
              Guardar y continuar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
