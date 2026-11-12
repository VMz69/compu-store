import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOGOS, STORE_FRONT_URL } from '@/85-pipeline-identificadores-texto/03-store.config'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { useToggle } from '@/76-pipeline-avisos-globales/03-useToggle'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { ROLES } from '../../../86-pipeline-datos-demo-personas/00-director-datos-demo-personas'
import { DEMO_PASSWORD, USERS_MOCK } from '../../../86-pipeline-datos-demo-personas/02-users.mock'
import { useAccessStore } from '../store'
import { useHomePath, useSession } from './useSession'

/**
 * Muestra el panel de cuentas de prueba en el login.
 * Útil en desarrollo y presentaciones; desactívalo en producción (.env).
 */
const SHOW_DEMO_CREDENTIALS = import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true'

const DEMO_ACCOUNTS = USERS_MOCK.map((u) => ({ email: u.email, roleName: ROLES[u.role].name }))

/** Formulario de inicio de sesión con correo y contraseña. */
export function useLoginForm() {
  const navigate = useNavigate()
  const login = useAccessStore((s) => s.login)
  const isLoading = useAccessStore((s) => s.isLoading)
  const { isAuthenticated } = useSession()
  const homePath = useHomePath()
  const { values, bind, setField } = useFormState({ email: '', password: '' })
  const passwordVisible = useToggle()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!values.email.trim() || !values.password) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }
    try {
      const result = await login(values.email, values.password)
      if (!result.ok) {
        setError(result.error)
        setField('password', '') // no dejar la contraseña fallida en pantalla
        return
      }
      navigate(`/${ROLES[result.user.role].allowedViews[0]}`, { replace: true })
      toast(`Bienvenido, ${result.user.name}`, 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    }
  }

  return {
    bind,
    onSubmit,
    error,
    isLoading,
    passwordVisible: passwordVisible.on,
    togglePasswordVisible: passwordVisible.toggle,
    isAuthenticated,
    homePath,
    storeUrl: STORE_FRONT_URL,
    logos: LOGOS,
    demo: SHOW_DEMO_CREDENTIALS ? { password: DEMO_PASSWORD, accounts: DEMO_ACCOUNTS } : null,
    /** Rellena el formulario con una cuenta de prueba (no inicia sesión solo). */
    fillDemoAccount: (email: string) => {
      setField('email', email)
      setField('password', DEMO_PASSWORD)
      setError(null)
    },
  }
}

export type LoginFormApi = ReturnType<typeof useLoginForm>
