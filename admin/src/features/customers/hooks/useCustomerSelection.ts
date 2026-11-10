import { useState } from 'react'
import { useFormState } from '@/shared/hooks/useFormState'
import { normalizePhone } from '../lib/customer.service'
import { useCustomersStore } from '../store'
import type { CustomerSnapshot } from '../types'

/** "directory" = cliente del directorio · "walkin" = cliente ocasional (datos a mano). */
export type CustomerMode = 'directory' | 'walkin'

export type CustomerSelectionInit = Partial<Pick<CustomerSnapshot, 'customerId' | 'name' | 'phone' | 'email'>>

/**
 * Selección de cliente para documentos comerciales (cotizaciones y pedidos).
 * Devuelve el snapshot que se guarda en el documento: si luego se edita el
 * cliente en el directorio, el documento emitido no cambia.
 */
export function useCustomerSelection(init: CustomerSelectionInit = {}) {
  const customers = useCustomersStore((s) => s.customers)
  const active = customers.filter((c) => c.active)
  const initialId = init.customerId && active.some((c) => c.id === init.customerId) ? init.customerId : ''

  const [mode, setMode] = useState<CustomerMode>(initialId || !init.name ? 'directory' : 'walkin')
  const form = useFormState({
    customerId: initialId,
    name: initialId ? '' : (init.name ?? ''),
    phone: initialId ? '' : (init.phone ?? ''),
    email: initialId ? '' : (init.email ?? ''),
  })
  const { values } = form
  const selected = active.find((c) => c.id === values.customerId)

  const snapshot: CustomerSnapshot =
    mode === 'directory'
      ? {
          customerId: selected?.id ?? null, name: selected?.name ?? '', phone: selected?.phone ?? '',
          email: selected?.email ?? '', documentId: selected?.documentId ?? '', city: selected?.city ?? '',
        }
      : { customerId: null, name: values.name.trim(), phone: values.phone.trim(), email: values.email.trim(), documentId: '', city: '' }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (mode === 'directory' && !selected) e.customer = 'Selecciona un cliente del directorio.'
    if (mode === 'walkin' && snapshot.name.length < 3) e.name = 'Ingresa el nombre del cliente.'
    if (mode === 'walkin' && normalizePhone(snapshot.phone).length < 8) e.phone = 'Ingresa un teléfono de contacto.'
    return e
  }

  /** Pasa a cliente ocasional; si se trae un texto de búsqueda que no es un teléfono, precarga el nombre. */
  const startWalkin = (draftName = '') => {
    const name = draftName.trim()
    if (name && !values.name && !/^[\d\s+-]+$/.test(name)) form.setField('name', name)
    setMode('walkin')
  }

  return {
    mode,
    setDirectoryMode: () => setMode('directory'),
    setWalkinMode: () => startWalkin(),
    startWalkin,
    bind: form.bind,
    /** Clientes activos que se pueden asignar a un documento. */
    customers: active,
    selected: selected ?? null,
    select: (id: string) => form.setField('customerId', id),
    clear: () => form.setField('customerId', ''),
    snapshot,
    validate,
  }
}

export type CustomerSelection = ReturnType<typeof useCustomerSelection>
