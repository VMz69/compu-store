import { useState } from 'react'
import { CONTACT_SUBJECTS } from '../config/contact.config'
import { buildContactUrl } from '../lib/whatsapp'
import { useToastStore } from '@/shared/store/toast.store'

interface ContactFormState {
  name: string
  phone: string
  subject: string
  message: string
}

const INITIAL_FORM: ContactFormState = {
  name: '',
  phone: '',
  subject: CONTACT_SUBJECTS[0],
  message: '',
}

/**
 * Formulario de contacto validado que redirige la consulta a WhatsApp.
 */
export const useContactForm = () => {
  const pushToast = useToastStore((state) => state.pushToast)
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM)

  const setField = (field: keyof ContactFormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const submit = () => {
    if (!form.name.trim() || !form.message.trim()) {
      pushToast('Por favor ingresa tu nombre y tu mensaje.', 'warning')
      return
    }
    window.open(buildContactUrl(form), '_blank', 'noopener,noreferrer')
    pushToast('Abriendo WhatsApp con tu consulta...', 'success')
  }

  return { form, setField, submit, subjects: CONTACT_SUBJECTS }
}
