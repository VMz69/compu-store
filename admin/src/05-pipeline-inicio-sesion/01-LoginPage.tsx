import { Navigate } from 'react-router-dom'
import { tracer } from '@/00-trazabilidad'
import { LoginCard } from './03-LoginCard'
import { useLoginForm } from './02-useLoginForm'

const t = tracer('LoginPage', 'src/features/access/pages/LoginPage.tsx')

export function LoginPage() {
  const api = useLoginForm()

  // Con sesión abierta, /login lleva directo a la vista de inicio del rol.
  if (api.isAuthenticated) return <Navigate to={api.homePath} replace />

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-fade-in overflow-y-auto" {...t('access.login')}>
      <LoginCard api={api} />
    </div>
  )
}
