import type { FormEvent } from 'react'
import { ensurePermission, usePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { toast } from '@/shared/store/toast.store'
import { useSettingsStore } from '../store'

type IdentityFormValues = {
  name: string
  email: string
  phone: string
  phone2: string
  address: string
}

/** Formulario de identidad comercial y sucursal. */
export function useIdentityForm() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const isLoading = useSettingsStore((s) => s.isLoading)
  const canEdit = usePermission('canEditSettings')
  const { values, bind } = useFormState<IdentityFormValues>({
    name: settings.name,
    email: settings.email,
    phone: settings.phones[0] ?? '',
    phone2: settings.phones[1] ?? '',
    address: settings.address,
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensurePermission('canEditSettings', 'Solo Superadmin puede modificar los ajustes globales')) return
    await updateSettings({
      name: values.name.trim() || settings.name,
      email: values.email.trim() || settings.email,
      address: values.address.trim() || settings.address,
      phones: [values.phone.trim() || settings.phones[0], values.phone2.trim()].filter(Boolean),
    })
    toast('Ajustes comerciales guardados', 'success')
  }

  return { bind, canEdit, onSubmit, isLoading }
}
