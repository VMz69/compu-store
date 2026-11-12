import { useId, useState, type KeyboardEvent } from 'react'
import { matchesCustomer, searchCustomers } from '../30-pipeline-registro-clientes/03-customer.service'
import type { CustomerSelection } from './02-useCustomerSelection'

const MAX_RESULTS = 8

/**
 * Buscador de clientes con patrón combobox (WAI-ARIA): filtra mientras se escribe,
 * navega con ↑/↓, elige con Enter y cierra con Escape. La selección vive en
 * `useCustomerSelection`; aquí solo está el estado de la búsqueda.
 */
export function useCustomerCombobox(selection: CustomerSelection) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  /** Al pulsar "Cambiar" el input reaparece y debe recibir el foco. */
  const [focusInput, setFocusInput] = useState(false)

  const results = searchCustomers(selection.customers, query, MAX_RESULTS)
  const totalMatches = selection.customers.filter((c) => matchesCustomer(c, query)).length
  const current = Math.min(activeIndex, Math.max(results.length - 1, 0))

  const choose = (id: string) => {
    selection.select(id)
    setQuery('')
    setOpen(false)
  }

  const move = (delta: number) => {
    if (!open) return setOpen(true)
    if (results.length === 0) return
    setActiveIndex((current + delta + results.length) % results.length)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1) }
    else if (event.key === 'Enter' && open && results[current]) { event.preventDefault(); choose(results[current].id) }
    else if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) }
  }

  const optionId = (id: string) => `${listId}-${id}`

  return {
    query,
    open,
    results,
    totalMatches,
    activeIndex: current,
    listId,
    optionId,
    choose,
    setActiveIndex,
    focusInput,
    /** Vuelve a buscar otro cliente (quita el seleccionado). */
    change: () => {
      selection.clear()
      setFocusInput(true)
      setOpen(true)
    },
    registerNew: selection.registerNew,
    /** Sin coincidencias: pasa a datos a mano (cliente nuevo u ocasional) con lo escrito. */
    useAsWalkin: () => selection.startWalkin(query),
    inputProps: {
      role: 'combobox' as const,
      'aria-expanded': open,
      'aria-controls': listId,
      'aria-autocomplete': 'list' as const,
      'aria-activedescendant': open && results[current] ? optionId(results[current].id) : undefined,
      value: query,
      onChange: (event: { target: { value: string } }) => {
        setQuery(event.target.value)
        setActiveIndex(0)
        setOpen(true)
      },
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
      onKeyDown,
    },
  }
}

export type CustomerCombobox = ReturnType<typeof useCustomerCombobox>
