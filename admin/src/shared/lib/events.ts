import type { KeyboardEvent, SyntheticEvent } from 'react'

export const stopPropagation = (event: SyntheticEvent): void => event.stopPropagation()

/** Props para aislar una zona interactiva dentro de un contenedor clickeable. */
export const isolate = {
  onClick: stopPropagation,
  onKeyDown: stopPropagation,
} as const

/** Convierte un contenedor no-botón en activable por clic y teclado (Enter/Espacio). */
export const clickable = (onActivate: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: onActivate,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate()
    }
  },
})
