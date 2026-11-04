import { useEffect } from 'react'
import type { RefObject } from 'react'

export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      // Los toggles marcados controlan el overlay y no deben cerrarlo al pulsarlos.
      if (target instanceof Element && target.closest('[data-overlay-toggle]')) return
      if (ref.current && !ref.current.contains(target as Node)) onOutside()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [ref, onOutside, enabled])
}
