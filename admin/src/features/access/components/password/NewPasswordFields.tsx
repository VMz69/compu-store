import type { ChangeEvent } from 'react'
import { Field } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { PasswordCheck } from '../../lib/password'
import { PasswordInput } from './PasswordInput'
import { PasswordStrength } from './PasswordStrength'

const t = tracer('NewPasswordFields', 'src/features/access/components/password/NewPasswordFields.tsx')

type Binder = (key: 'password' | 'confirm') => {
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

interface NewPasswordFieldsProps {
  bind: Binder
  errors: Record<string, string>
  policy: { checks: PasswordCheck[]; score: number }
  visible: boolean
  onToggleVisible: () => void
  /** Si se recibe, muestra el botón "Generar segura". */
  onGenerate?: () => void
  /** Prefijo de trazabilidad (ej. "access.user-form"). */
  traceId: string
  label?: string
}

/**
 * Bloque reutilizable "nueva contraseña + confirmación + medidor".
 * Lo usan: alta de usuario, restablecer contraseña y cambio obligatorio.
 */
export function NewPasswordFields(props: NewPasswordFieldsProps) {
  const { bind, errors, policy, visible, onToggleVisible, onGenerate, traceId, label = 'Contraseña' } = props

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label={label}
          variant="caps"
          required
          error={errors.password}
          aside={
            onGenerate && (
              <button
                type="button"
                className="mb-1 text-[10px] font-bold text-brand hover:underline"
                onClick={onGenerate}
                {...t(`${traceId}.generate`)}
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1" aria-hidden="true" />
                Generar segura
              </button>
            )
          }
        >
          <PasswordInput
            autoComplete="new-password"
            visible={visible}
            onToggleVisible={onToggleVisible}
            invalid={Boolean(errors.password)}
            {...bind('password')}
            {...t(`${traceId}.password`)}
          />
        </Field>
        <Field label="Confirmar contraseña" variant="caps" required error={errors.confirm}>
          <PasswordInput
            autoComplete="new-password"
            visible={visible}
            onToggleVisible={onToggleVisible}
            invalid={Boolean(errors.confirm)}
            {...bind('confirm')}
            {...t(`${traceId}.confirm`)}
          />
        </Field>
      </div>
      <PasswordStrength checks={policy.checks} score={policy.score} />
    </div>
  )
}
