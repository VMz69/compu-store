import { useState, type ChangeEvent } from 'react'

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
type FormValues = Record<string, string | boolean>

/**
 * Estado de formulario controlado y genérico. `bind` conecta inputs de texto,
 * selects y textareas; `bindCheck` conecta checkboxes. La vista solo hace spread.
 */
export function useFormState<T extends FormValues>(initial: T) {
  const [values, setValues] = useState<T>(initial)

  const setField = <K extends keyof T>(key: K, value: T[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const bind = <K extends keyof T>(key: K) => ({
    name: String(key),
    value: String(values[key] ?? ''),
    onChange: (event: ChangeEvent<FieldElement>) => setField(key, event.target.value as T[K]),
  })

  const bindCheck = <K extends keyof T>(key: K) => ({
    name: String(key),
    checked: Boolean(values[key]),
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setField(key, event.target.checked as T[K]),
  })

  return { values, setField, bind, bindCheck }
}
