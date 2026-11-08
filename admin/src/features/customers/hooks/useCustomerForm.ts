import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { CUSTOMER_TYPE_LABELS, validateCustomer } from '../lib/customer.service'
import { useCustomersStore } from '../store'
import type { Customer, CustomerType } from '../types'

type CustomerFormValues = {
  id: string
  type: string
  name: string
  documentId: string
  phone: string
  email: string
  city: string
  address: string
  notes: string
  active: boolean
}

const TYPE_OPTIONS = (Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((value) => ({
  value,
  label: CUSTOMER_TYPE_LABELS[value],
}))

/** Alta/edición de cliente (payload del modal: cliente a editar o null). */
export function useCustomerForm() {
  const editing = useModalPayload<Customer | null>()
  const customers = useCustomersStore((s) => s.customers)
  const saveCustomer = useCustomersStore((s) => s.saveCustomer)
  const isLoading = useCustomersStore((s) => s.isLoading)
  const [submitted, setSubmitted] = useState(false)

  const { values, bind, bindCheck } = useFormState<CustomerFormValues>({
    id: editing?.id ?? '',
    type: editing?.type ?? 'persona',
    name: editing?.name ?? '',
    documentId: editing?.documentId ?? '',
    phone: editing?.phone ?? '',
    email: editing?.email ?? '',
    city: editing?.city ?? 'Cojutepeque',
    address: editing?.address ?? '',
    notes: editing?.notes ?? '',
    active: editing?.active ?? true,
  })
  const isCompany = values.type === 'empresa'
  const errors = submitted ? validateCustomer(values, customers) : {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateCustomer(values, customers)).length > 0) return
    if (!ensurePermission('canManageCustomers', 'Su rol no puede gestionar clientes')) return
    const result = await saveCustomer({
      id: values.id || undefined,
      type: values.type as CustomerType,
      name: values.name.trim(),
      documentId: values.documentId.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      city: values.city.trim(),
      address: values.address.trim(),
      notes: values.notes.trim(),
      active: values.active,
    })
    closeModal()
    toast(result === 'updated' ? 'Cliente actualizado' : `Cliente ${values.name.trim()} registrado`, 'success')
  }

  return {
    isEdit: Boolean(editing),
    title: editing ? 'Editar cliente' : 'Nuevo cliente',
    bind,
    bindCheck,
    errors,
    typeOptions: TYPE_OPTIONS,
    // Etiquetas que cambian con el tipo de cliente (persona ↔ empresa).
    labels: {
      name: isCompany ? 'Razón social' : 'Nombre completo',
      namePlaceholder: isCompany ? 'Ej. Consultores SV, S.A. de C.V.' : 'Ej. María Hernández',
      document: isCompany ? 'NIT' : 'DUI',
      documentPlaceholder: isCompany ? '0614-250318-102-3' : '01234567-8',
    },
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type CustomerFormApi = ReturnType<typeof useCustomerForm>
