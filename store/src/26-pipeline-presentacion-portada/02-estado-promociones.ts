import { useEffect, useState } from 'react'
import { promotions } from '@/06-pipeline-datos-mock/00-director-datos-mock'
import { useUIStore } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'

const AUTOPLAY_MS = 7000

/**
 * Carrusel del hero: navegación circular y autoplay.
 *
 * El autoplay se pausa al interactuar (hover/foco) y se desactiva si el usuario
 * prefiere movimiento reducido, cumpliendo el criterio de accesibilidad de
 * contenido en movimiento.
 */
export const useHeroSlider = () => {
  const activeSlide = useUIStore((state) => state.activeHeroSlide)
  const setSlide = useUIStore((state) => state.setHeroSlide)
  const [isPaused, setIsPaused] = useState(false)
  const total = promotions.length
  const promotion = promotions[activeSlide] ?? promotions[0]

  const goTo = (index: number) => setSlide(index, total)
  const next = () => setSlide(activeSlide + 1, total)
  const prev = () => setSlide(activeSlide - 1, total)

  useEffect(() => {
    if (isPaused || total <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = setInterval(() => {
      const state = useUIStore.getState()
      state.setHeroSlide(state.activeHeroSlide + 1, total)
    }, AUTOPLAY_MS)

    return () => clearInterval(timer)
  }, [isPaused, total])

  return {
    promotion,
    activeSlide,
    total,
    goTo,
    next,
    prev,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  }
}
