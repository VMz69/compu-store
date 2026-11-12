import { useEffect, useRef, useState, type CSSProperties } from 'react'

const GAP = 4
const MARGIN = 8

/**
 * Ventana emergente anclada a un botón, dibujada en `document.body` (portal) con
 * posición fija: no la recortan contenedores con `overflow` (paneles, modales).
 * Se abre hacia arriba si no cabe abajo y se cierra al hacer scroll fuera de ella,
 * al cambiar el tamaño de la ventana o al hacer clic fuera.
 */
export function useAnchoredPopover(size: { width: number; height: number }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const place = () => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = window.innerHeight - rect.bottom
    const top = below >= size.height + GAP || rect.top < size.height + GAP ? rect.bottom + GAP : rect.top - size.height - GAP
    const left = Math.min(Math.max(MARGIN, rect.left), window.innerWidth - size.width - MARGIN)
    setStyle({ position: 'fixed', top, left, width: size.width })
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onScroll = (e: Event) => {
      if (!popoverRef.current?.contains(e.target as Node)) close()
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!popoverRef.current?.contains(target) && !anchorRef.current?.contains(target)) close()
    }
    // Accesibilidad: el foco entra al calendario (día seleccionado o de hoy).
    const raf = requestAnimationFrame(() => popoverRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus())
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return {
    open,
    style,
    anchorRef,
    popoverRef,
    toggle: () => {
      if (!open) place()
      setOpen((o) => !o)
    },
    close: () => {
      setOpen(false)
      anchorRef.current?.focus()
    },
  }
}
