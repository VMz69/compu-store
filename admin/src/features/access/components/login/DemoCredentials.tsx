import { tracer } from '@/00-trazabilidad'

const t = tracer('DemoCredentials', 'src/features/access/components/login/DemoCredentials.tsx')

interface DemoCredentialsProps {
  password: string
  accounts: Array<{ email: string; roleName: string }>
  onUse: (email: string) => void
}

/**
 * Cuentas de prueba (solo con VITE_SHOW_DEMO_CREDENTIALS=true).
 * Es un <details> nativo: plegado por defecto para no competir con el formulario.
 */
export function DemoCredentials({ password, accounts, onUse }: DemoCredentialsProps) {
  return (
    <details className="mt-4 group rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs" {...t('access.login.demo')}>
      <summary className="cursor-pointer list-none px-3 py-2 font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>
          <i className="fa-solid fa-flask mr-1.5 text-amber-500" aria-hidden="true" /> Cuentas de prueba
        </span>
        <i className="fa-solid fa-chevron-down text-[10px] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-3 pb-3 space-y-1.5">
        <p className="text-[10px] text-slate-400">
          Contraseña de todas: <code className="font-mono font-bold text-slate-600 dark:text-slate-300">{password}</code>
        </p>
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
            onClick={() => onUse(account.email)}
            {...t(`access.login.demo.${account.email}`)}
          >
            <span className="min-w-0">
              <span className="block font-bold text-slate-700 dark:text-slate-200 truncate">{account.roleName}</span>
              <span className="block text-[10px] text-slate-400 truncate">{account.email}</span>
            </span>
            <span className="text-[10px] font-bold text-brand shrink-0">Usar</span>
          </button>
        ))}
      </div>
    </details>
  )
}
