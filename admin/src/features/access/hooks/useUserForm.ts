import { useState, type FormEvent } from 'react'
import { useFormState } from '@/shared/hooks/useFormState'
import { useToggle } from '@/shared/hooks/useToggle'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { checkPassword, generatePassword } from '../lib/password'
import { ensurePermission } from '../lib/permissions'
import { deactivateBlockReason, isEmailTaken, isValidEmail, roleChangeBlockReason } from '../lib/userRules'
import { ROLE_LIST } from '../mocks/roles.mock'
import { useAccessStore } from '../store'
import type { RoleId, User } from '../types'
import { useSession } from './useSession'

type UserFormValues = {
  name: string
  email: string
  phone: string
  role: string
  active: boolean
  password: string
  confirm: string
  mustChangePassword: boolean
}

const PHONE_PATTERN = /^[0-9+\-\s]{8,15}$/
const ROLE_OPTIONS = ROLE_LIST.map((r) => ({ value: r.id, label: `${r.name} · ${r.title}` }))

/**
 * Alta y edición de usuario (payload del modal: usuario a editar o null).
 * - Alta: perfil + contraseña inicial (con política y confirmación).
 * - Edición: solo perfil; la contraseña se cambia con "Restablecer contraseña".
 * Los errores aparecen tras el primer intento de guardar y se corrigen en vivo.
 */
export function useUserForm() {
  const editing = useModalPayload<User | null>()
  const users = useAccessStore((s) => s.users)
  const createUser = useAccessStore((s) => s.createUser)
  const updateUser = useAccessStore((s) => s.updateUser)
  const isLoading = useAccessStore((s) => s.isLoading)
  const { user: current } = useSession()
  const isEdit = Boolean(editing)
  const passwordVisible = useToggle()
  const [submitted, setSubmitted] = useState(false)

  const { values, bind, bindCheck, setField } = useFormState<UserFormValues>({
    name: editing?.name ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    role: editing?.role ?? 'caja_inventario',
    active: editing?.active ?? true,
    password: '',
    confirm: '',
    mustChangePassword: true,
  })
  const policy = checkPassword(values.password)

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (values.name.trim().length < 3) e.name = 'Ingresa el nombre completo.'
    if (!isValidEmail(values.email)) e.email = 'Correo no válido.'
    else if (isEmailTaken(values.email, users, editing?.id)) e.email = 'Ya existe un usuario con este correo.'
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) e.phone = 'Teléfono no válido (ej. 7038-8225).'
    if (editing) {
      const role = values.role as RoleId
      const roleBlock = roleChangeBlockReason(editing, role, values.active, users)
      if (roleBlock) e.role = roleBlock
      if (!values.active) {
        const block = deactivateBlockReason(editing, current?.id ?? null, users)
        if (block) e.active = block
      }
    } else {
      if (!policy.isValid) e.password = 'La contraseña no cumple los requisitos.'
      if (values.confirm !== values.password) e.confirm = 'Las contraseñas no coinciden.'
    }
    return e
  }

  const errors = submitted ? validate() : {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate()).length > 0) return
    if (!ensurePermission('canManageUsers', 'Solo el Superadmin puede gestionar usuarios.')) return
    const profile = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      role: values.role as RoleId,
      active: values.active,
    }
    if (editing) {
      await updateUser(editing.id, profile)
      toast(`Usuario ${profile.name} actualizado`, 'success')
    } else {
      await createUser({ ...profile, password: values.password, mustChangePassword: values.mustChangePassword })
      toast(`Usuario ${profile.name} creado. Comparte la contraseña inicial por un canal seguro.`, 'success')
    }
    closeModal()
  }

  return {
    isEdit,
    title: isEdit ? 'Editar usuario' : 'Nuevo usuario',
    bind,
    bindCheck,
    errors,
    policy,
    showPasswordRules: values.password.length > 0 || submitted,
    roleOptions: ROLE_OPTIONS,
    passwordVisible: passwordVisible.on,
    togglePasswordVisible: passwordVisible.toggle,
    /** Genera una contraseña temporal segura, la copia en ambos campos y la muestra. */
    generate: () => {
      const password = generatePassword()
      setField('password', password)
      setField('confirm', password)
      passwordVisible.set(true)
    },
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type UserFormApi = ReturnType<typeof useUserForm>
