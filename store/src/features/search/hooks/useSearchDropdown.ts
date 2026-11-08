import { useEffect, useRef, useState } from 'react'
import { useSearchLock } from './useSearchLock'

/**
 * Estado de apertura del desplegable de búsqueda.
 *
 * Cierra al hacer clic fuera del contenedor o al pulsar Escape, y en móvil
 * bloquea el scroll del documento mientras el desplegable está visible.
 */
export const useSearchDropdown = (isDesktop: boolean, isCollapsed: boolean, value: string) => {
  const [openState, setOpenState] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) setOpenState(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenState(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const openDropdown = () => setOpenState(true)
  const closeDropdown = () => setOpenState(false)
  const isOpen = !isCollapsed && openState
  const showDropdown = isOpen && value.trim().length > 0

  useSearchLock(!isDesktop && showDropdown)

  return { containerRef, showDropdown, openDropdown, closeDropdown }
}
