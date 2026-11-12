import { useState, type FormEvent } from 'react'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal, openModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { countByStatus } from '../lib/order.service'
import { flowStatuses, isOrderStatusId, statusOf, validateStatusLabel } from '../lib/orderFlow'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { OrderStatusId } from '../types'

/** Tabla del flujo de pedidos: estados en orden, transiciones (fijas) y textos editables. */
export function useFlowTable() {
  const orders = useSalesStore((s) => s.orders)
  // Suscripción a los textos para re-renderizar al editarlos (statusOf los aplica).
  useSalesStore((s) => s.statusLabels)
  const canEdit = usePermission('canEditSettings')

  return {
    rows: flowStatuses().map((status) => ({
      status,
      count: countByStatus(orders, status.id),
      nextNames: status.next.map((id) => statusOf(id).name),
    })),
    canEdit,
    edit: (statusId: OrderStatusId) => openModal(SALES_MODALS.statusLabel, statusId),
  }
}

export type FlowTableApi = ReturnType<typeof useFlowTable>

/** Edición del nombre visible y la descripción de un estado (payload = id del estado). */
export function useStatusLabelForm() {
  const payload = useModalPayload<string>()
  const statusId: OrderStatusId = isOrderStatusId(payload) ? payload : 'registrado'
  const status = statusOf(statusId)
  const update = useSalesStore((s) => s.updateStatusLabel)
  const [submitted, setSubmitted] = useState(false)
  const { values, bind } = useFormState({ name: status.name, description: status.description })
  const errors = submitted ? validateStatusLabel(statusId, values) : {}

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateStatusLabel(statusId, values)).length > 0) return
    if (!ensurePermission('canEditSettings', 'No tienes permiso para editar la configuración (flujo de pedidos)')) return
    update(statusId, values)
    closeModal()
    toast(`Estado "${values.name.trim()}" actualizado`, 'success')
  }

  return { status, bind, errors, onSubmit, onClose: closeModal }
}
