import { Button, Field, Input, SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { LoginFormApi } from './02-useLoginForm'
import { PasswordInput } from '../11-pipeline-restablecimiento-contrasena/02-PasswordInput'
import { DemoCredentials } from './04-DemoCredentials'

const t = tracer('LoginCard', 'src/features/access/components/login/LoginCard.tsx')

/** Tarjeta de inicio de sesión: identidad de marca + formulario de credenciales. */
export function LoginCard({ api }: { api: LoginFormApi }) {
  const { bind, onSubmit, error, isLoading, logos, storeUrl, demo } = api

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-800 p-8 w-[min(94vw,420px)]"
      {...t('access.login.card')}
    >
      <div className="mb-6 flex flex-col items-center">
        <SafeImage src={logos.horizontal} fallback={logos.icon} alt="CompuStore SV" className="h-10 dark:hidden object-contain mb-2" />
        <SafeImage src={logos.onDark} fallback={logos.icon} alt="CompuStore SV" className="h-10 hidden dark:block object-contain mb-2" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-brand">Panel Administrativo</span>
      </div>

      <div className="text-center mb-5">
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Iniciar sesión</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingresa con tu cuenta de colaborador.</p>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4 text-xs" {...t('access.login.form')}>
        {error && (
          <p role="alert" className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {error}
          </p>
        )}
        <Field label="Correo electrónico" variant="caps">
          <Input
            type="email"
            autoComplete="username"
            placeholder="nombre@compustoresv.com"
            autoFocus
            {...bind('email')}
            {...t('access.login.email')}
          />
        </Field>
        <Field label="Contraseña" variant="caps">
          <PasswordInput
            autoComplete="current-password"
            placeholder="••••••••"
            visible={api.passwordVisible}
            onToggleVisible={api.togglePasswordVisible}
            {...bind('password')}
            {...t('access.login.password')}
          />
        </Field>
        <Button type="submit" size="md" shape="xl" isLoading={isLoading} className="w-full" {...t('access.login.submit')}>
          Ingresar
        </Button>
      </form>

      {demo && <DemoCredentials password={demo.password} accounts={demo.accounts} onUse={api.fillDemoAccount} />}

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:underline" {...t('access.login.store-link')}>
          <i className="fa-solid fa-store" aria-hidden="true" /> Abrir Tienda Web
        </a>
      </div>
    </div>
  )
}
