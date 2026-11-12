import { useState } from 'react'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { findByPhone, normalizePhone, validateCustomer } from '../30-pipeline-registro-clientes/03-customer.service'
import { useCustomersStore } from '../33-pipeline-historial-clientes/00-director-historial-clientes'
import type { Customer, CustomerSnapshot, CustomerType } from '../33-pipeline-historial-clientes/03-types'

/** "directory" = cliente del directorio · "walkin" = datos a mano (ocasional o nuevo). */
export type CustomerMode = 'directory' | 'walkin'

export type CustomerSelectionInit = Partial<Pick<CustomerSnapshot, 'customerId' | 'name' | 'phone' | 'email'>>

interface CustomerSelectionOptions {
  /**
   * true (pedidos): el cliente escrito a mano se registra en el directorio al guardar
   * el documento, con las mismas reglas que el alta manual. false (cotizaciones): queda
   * como cliente ocasional, solo en el documento.
   */
  registerNew?: boolean
}

const toSnapshot = (c: Customer): CustomerSnapshot => ({
  customerId: c.id, name: c.name, phone: c.phone, email: c.email, documentId: c.documentId, city: c.city,
})

/**
 * Selección de cliente para documentos comerciales (cotizaciones y pedidos).
 * El documento guarda un snapshot: si luego se edita el cliente en el directorio,
 * el documento emitido no cambia.
 */
export function useCustomerSelection(init: CustomerSelectionInit = {}, { registerNew = false }: CustomerSelectionOptions = {}) {
  const customers = useCustomersStore((s) => s.customers)
  const createCustomer = useCustomersStore((s) => s.createCustomer)
  const active = customers.filter((c) => c.active)
  const initialId = init.customerId && active.some((c) => c.id === init.customerId) ? init.customerId : ''

  const [mode, setMode] = useState<CustomerMode>(initialId || !init.name ? 'directory' : 'walkin')
  const form = useFormState({
    customerId: initialId,
    type: 'persona',
    name: initialId ? '' : (init.name ?? ''),
    phone: initialId ? '' : (init.phone ?? ''),
    email: initialId ? '' : (init.email ?? ''),
    documentId: '',
    city: '',
  })
  const { values } = form
  const selected = active.find((c) => c.id === values.customerId) ?? null
  /** Cliente ya registrado con el teléfono escrito (evita duplicados en el directorio). */
  const duplicate = mode === 'walkin' ? findByPhone(customers, values.phone) : null

  const draft = {
    type: values.type as CustomerType, name: values.name.trim(), phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(), documentId: values.documentId.trim(), city: values.city.trim(),
  }
  const snapshot: CustomerSnapshot =
    mode === 'directory'
      ? selected ? toSnapshot(selected) : { customerId: null, name: '', phone: '', email: '', documentId: '', city: '' }
      : { customerId: null, ...draft }

  const validate = (): Record<string, string> => {
    if (mode === 'directory') return selected ? {} : { customer: 'Selecciona un cliente del directorio.' }
    if (registerNew) return validateCustomer({ id: '', ...draft }, customers)
    const e: Record<string, string> = {}
    if (draft.name.length < 3) e.name = 'Ingresa el nombre del cliente.'
    if (normalizePhone(draft.phone).length < 8) e.phone = 'Ingresa un teléfono de contacto.'
    return e
  }

  const select = (id: string) => {
    form.setField('customerId', id)
    setMode('directory')
  }

  /** Pasa a datos a mano; si se trae un texto de búsqueda que no es un teléfono, precarga el nombre. */
  const startWalkin = (draftName = '') => {
    const name = draftName.trim()
    if (name && !values.name && !/^[\d\s+-]+$/.test(name)) form.setField('name', name)
    setMode('walkin')
  }

  /**
   * Snapshot definitivo al guardar el documento. Con `registerNew`, da de alta al
   * cliente y lo deja seleccionado: si el guardado del documento falla y se reintenta,
   * no se crea un duplicado.
   */
  const commit = async (): Promise<CustomerSnapshot & { created: Customer | null }> => {
    if (mode === 'directory' || !registerNew) return { ...snapshot, created: null }
    const created = await createCustomer({ ...draft, address: '', notes: '', active: true })
    select(created.id)
    return { ...toSnapshot(created), created }
  }

  return {
    mode,
    registerNew,
    setDirectoryMode: () => setMode('directory'),
    setWalkinMode: () => startWalkin(),
    startWalkin,
    bind: form.bind,
    isCompany: values.type === 'empresa',
    /** Clientes activos que se pueden asignar a un documento. */
    customers: active,
    selected,
    select,
    clear: () => form.setField('customerId', ''),
    duplicate,
    snapshot,
    validate,
    commit,
  }
}

export type CustomerSelection = ReturnType<typeof useCustomerSelection>
