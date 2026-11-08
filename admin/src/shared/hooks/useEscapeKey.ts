import { useEffect, useRef } from 'react'

type HandlerRef = { current: () => void }

/** Pila de capas abiertas: solo la más reciente (la de arriba) responde a Escape. */
const layers: HandlerRef[] = []

/**
 * Ejecuta `handler` al presionar Escape mientras el componente esté montado.
 *
 * Con capas apiladas (ej. diálogo de confirmación sobre un modal) solo cierra
 * la superior; sin esta pila, un Escape cerraría ambas a la vez.
 */
export function useEscapeKey(handler: () => void): void {
  const ref = useRef(handler)

  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    layers.push(ref)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && layers[layers.length - 1] === ref) ref.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      layers.splice(layers.indexOf(ref), 1)
    }
  }, [])
}
