import { useState, type FormEvent } from 'react'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { useToggle } from '@/76-pipeline-avisos-globales/03-useToggle'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { checkPassword, generatePassword, verifyPassword } from './04-password'
import { ensurePermission } from '../06-pipeline-sesion-permisos/02-permissions'
import { useAccessStore } from '../06-pipeline-sesion-permisos/04-store'
import { useAccessActions } from '../07-pipeline-administracion-usuarios/03-useAccessActions'
import { useSession } from '../06-pipeline-sesion-permisos/00-director-sesion-permisos'

/** Núcleo compartido: nueva contraseña + confirmación + política + visibilidad. */
function useNewPasswordFields() {
  const { values, bind, bindCheck, setField } = useFormState({ password: '', confirm: '', mustChangePassword: true })
  const visible = useToggle()
  const [submitted, setSubmitted] = useState(false)
  const policy = checkPassword(values.password)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!policy.isValid) e.password = 'La contraseña no cumple los requisitos.'
    if (values.confirm !== values.password) e.confirm = 'Las contraseñas no coinciden.'
    return e
  }

  return {
    values,
    bind,
    bindCheck,
    setField,
    policy,
    errors: submitted ? validate() : ({} as Record<string, string>),
    /** Marca el intento de envío y devuelve si el formulario es válido. */
    attempt: () => {
      setSubmitted(true)
      return Object.keys(validate()).length === 0
    },
    passwordVisible: visible.on,
    togglePasswordVisible: visible.toggle,
    generate: () => {
      const password = generatePassword()
      setField('password', password)
      setField('confirm', password)
      visible.set(true)
    },
  }
}

/**
 * Restablecer la contraseña de otro usuario (payload del modal: id del usuario).
 * Por defecto obliga a cambiarla en el siguiente ingreso (contraseña temporal).
 */
export function useResetPasswordForm() {
  const userId = useModalPayload<number>()
  const target = useAccessStore((s) => s.users.find((u) => u.id === userId))
  const setPassword = useAccessStore((s) => s.setPassword)
  const isLoading = useAccessStore((s) => s.isLoading)
  const { user: current } = useSession()
  const fields = useNewPasswordFields()
  const isSelf = target?.id === current?.id

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target || !fields.attempt()) return
    if (!ensurePermission('canManageUsers', 'No tienes permiso para gestionar usuarios (contraseñas).')) return
    // Si es la propia cuenta, no tiene sentido forzar otro cambio.
    await setPassword(target.id, fields.values.password, isSelf ? false : fields.values.mustChangePassword)
    closeModal()
    toast(`Contraseña de ${target.name} actualizada`, 'success')
  }

  return { target, isSelf, ...fields, onSubmit, onClose: closeModal, isLoading }
}

/**
 * Cambio obligatorio en el primer ingreso (o tras un restablecimiento).
 * Exige que la nueva contraseña sea distinta de la temporal.
 */
export function useChangePasswordForm() {
  const { user } = useSession()
  const setPassword = useAccessStore((s) => s.setPassword)
  const isLoading = useAccessStore((s) => s.isLoading)
  const { logout } = useAccessActions()
  const fields = useNewPasswordFields()
  const [sameAsTemporary, setSameAsTemporary] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSameAsTemporary(false)
    if (!user || !fields.attempt()) return
    if (await verifyPassword(fields.values.password, user.passwordHash)) {
      setSameAsTemporary(true)
      return
    }
    await setPassword(user.id, fields.values.password, false)
    toast('Contraseña actualizada. ¡Bienvenido!', 'success')
  }

  return {
    user,
    ...fields,
    errors: sameAsTemporary
      ? { ...fields.errors, password: 'Debe ser distinta de la contraseña temporal.' }
      : fields.errors,
    onSubmit,
    logout,
    isLoading,
  }
}

export type NewPasswordApi = ReturnType<typeof useNewPasswordFields>
