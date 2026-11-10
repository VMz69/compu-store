import { useEffect, useRef, useState } from 'react'
import { useEscapeKey } from './useEscapeKey'
import { useImageZoom } from './useImageZoom'

/**
 * Visor de imágenes a pantalla completa:
 * - Navegación circular (botones, miniaturas, flechas ← →).
 * - Zoom (rueda, doble clic, + / − / 0) y arrastre cuando hay zoom.
 * - Pantalla completa nativa del navegador (tecla F o botón).
 * - Escape cierra solo esta capa (pila de `useEscapeKey`).
 */
export function useLightbox(count: number, startIndex: number, onClose: () => void) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, count - 1)))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const zoom = useImageZoom()

  const go = (next: number) => {
    if (count === 0) return
    setIndex(((next % count) + count) % count)
    zoom.reset() // cada imagen abre sin zoom
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void container?.requestFullscreen?.()
  }

  useEscapeKey(onClose)

  // Atajos de teclado con los handlers del último render.
  const keys = useRef<Record<string, () => void>>({})
  useEffect(() => {
    keys.current = {
      ArrowLeft: () => go(index - 1),
      ArrowRight: () => go(index + 1),
      '+': zoom.zoomIn,
      '=': zoom.zoomIn,
      '-': zoom.zoomOut,
      '0': zoom.reset,
      f: toggleFullscreen,
    }
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = keys.current[e.key]
      if (!action || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      action()
    }
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      if (document.fullscreenElement) void document.exitFullscreen()
    }
  }, [])

  return {
    attachContainer: setContainer,
    index,
    count,
    hasMany: count > 1,
    go,
    prev: () => go(index - 1),
    next: () => go(index + 1),
    zoom,
    isFullscreen,
    canFullscreen: typeof document !== 'undefined' && document.fullscreenEnabled,
    toggleFullscreen,
  }
}

export type LightboxState = ReturnType<typeof useLightbox>
