import type { FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { useSalesStore } from '../store'
import type { Channel } from '../types'

type ChannelFormValues = {
  id: string
  name: string
  badge: string
  icon: string
  description: string
  active: boolean
}

/** Alta/edición de canal de venta (payload = canal a editar o null). */
export function useChannelForm() {
  const channel = useModalPayload<Channel | null>()
  const saveChannel = useSalesStore((s) => s.saveChannel)
  const isLoading = useSalesStore((s) => s.isLoading)
  const { values, bind, bindCheck } = useFormState<ChannelFormValues>({
    id: channel?.id ?? '',
    name: channel?.name ?? '',
    badge: channel?.badge ?? 'Canal',
    icon: channel?.icon ?? 'fa-solid fa-store',
    description: channel?.description ?? '',
    active: channel?.active ?? true,
  })
  const isEdit = Boolean(channel)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensurePermission('canEditSettings', 'Solo Superadmin puede gestionar canales de venta')) return
    await saveChannel({
      id: values.id || undefined,
      name: values.name.trim(),
      badge: values.badge.trim() || 'Canal',
      icon: values.icon.trim() || 'fa-solid fa-store',
      description: values.description.trim(),
      active: values.active,
    })
    closeModal()
    toast('Canal de venta guardado con éxito', 'success')
  }

  return {
    bind,
    bindCheck,
    title: isEdit ? 'Editar Canal de Venta' : 'Añadir Nuevo Canal de Venta',
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}
