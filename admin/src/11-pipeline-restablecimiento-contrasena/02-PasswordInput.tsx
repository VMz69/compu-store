import { tracer } from '@/00-trazabilidad'
import { Input, type InputProps } from '@/00-director-interfaz'

const t = tracer('PasswordInput', 'src/features/access/components/password/PasswordInput.tsx')

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Visibilidad controlada desde el hook del formulario (un toggle puede servir a varios campos). */
  visible: boolean
  onToggleVisible: () => void
}

/** Campo de contraseña con botón mostrar/ocultar accesible. */
export function PasswordInput({ visible, onToggleVisible, className, ...rest }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={className ? `pr-9 ${className}` : 'pr-9'} {...rest} />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-slate-400 hover:text-brand transition-colors"
        {...t(`access.password.toggle-visibility.${rest.name ?? rest.id ?? 'field'}`)}
      >
        <i className={visible ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs'} aria-hidden="true" />
      </button>
    </div>
  )
}
