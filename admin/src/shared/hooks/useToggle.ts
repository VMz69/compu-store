import { useState } from 'react'

/** Booleano con alternador (mostrar/ocultar, abrir/cerrar…). */
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  return { on, toggle: () => setOn((v) => !v), set: setOn }
}
