import { useState, type FormEvent } from 'react'
import { ensurePermission, usePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { toast } from '@/shared/store/toast.store'
import { ESTABLISHMENT_TYPES, toWhatsappNumber, validateIdentity, type IdentityValues } from '../lib/identity'
import { useSettingsStore } from '../store'

/** Formulario de identidad del emisor: datos comerciales + datos del contribuyente (DTE). */
export function useIdentityForm() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const isLoading = useSettingsStore((s) => s.isLoading)
  const canEdit = usePermission('canEditSettings')
  const [submitted, setSubmitted] = useState(false)
  const { values, bind } = useFormState<IdentityValues>({
    name: settings.name,
    email: settings.email,
    phone: settings.phones[0] ?? '',
    phone2: settings.phones[1] ?? '',
    address: settings.address,
    legalName: settings.legalName,
    nit: settings.nit,
    nrc: settings.nrc,
    economicActivity: settings.economicActivity,
    establishmentType: settings.establishmentType,
  })
  const errors = submitted ? validateIdentity(values) : {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateIdentity(values)).length > 0) return toast('Revisa los datos marcados.', 'warning')
    if (!ensurePermission('canEditSettings', 'No tienes permiso para editar la configuración')) return
    await updateSettings({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      address: values.address.trim(),
      phones: [values.phone.trim(), values.phone2.trim()].filter(Boolean),
      whatsappNumber: toWhatsappNumber(values.phone),
      legalName: values.legalName.trim().toUpperCase(),
      nit: values.nit.trim(),
      nrc: values.nrc.trim(),
      economicActivity: values.economicActivity.trim(),
      establishmentType: values.establishmentType,
    })
    toast('Datos del emisor guardados · aplican a los próximos documentos', 'success')
  }

  /** Vista previa en vivo de cómo se imprime el emisor en cotizaciones y facturas. */
  const preview = {
    name: values.name.trim() || settings.name,
    address: values.address.trim() || settings.address,
    phones: [values.phone.trim(), values.phone2.trim()].filter(Boolean),
    email: values.email.trim() || settings.email,
    legalName: values.legalName.trim().toUpperCase() || settings.legalName,
    nit: values.nit.trim(),
    nrc: values.nrc.trim(),
    economicActivity: values.economicActivity.trim(),
    establishmentType: values.establishmentType,
  }

  return {
    bind,
    errors,
    canEdit,
    onSubmit,
    isLoading,
    preview,
    establishmentOptions: ESTABLISHMENT_TYPES.map((v) => ({ value: v, label: v })),
    /** IVA: normativa nacional, solo informativo aquí. */
    taxPercent: Math.round(settings.taxRate * 100),
  }
}

export type IdentityFormApi = ReturnType<typeof useIdentityForm>
