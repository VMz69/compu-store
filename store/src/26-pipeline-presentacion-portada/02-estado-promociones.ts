import { useEffect, useMemo, useState } from 'react'
import { promotions as plantillas } from '@/06-pipeline-datos-mock/00-director-datos-mock'
import { products } from '@/38-pipeline-datos-api/00-director-datos-api'
import { useUIStore } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'
import { calculateDiscountPercentage, formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import type { Product, Promotion } from '@/00-director-modelos'

const AUTOPLAY_MS = 7000

/** Textos neutrales cuando la categoría no tiene datos para el marcador (sin % inventados hasta L12). */
const SIN_PRECIO = 'CONSULTA PRECIOS'
const SIN_DESCUENTO = 'PRECIOS ESPECIALES'

/** Resuelve `{precioMinimo}` y `{descuento}` con los productos reales de la categoría. */
const resolverTexto = (plantilla: string, catalogo: Product[]): string => {
  if (plantilla.includes('{precioMinimo}')) {
    if (catalogo.length === 0) return SIN_PRECIO
    return plantilla.replace('{precioMinimo}', formatCurrency(Math.min(...catalogo.map((p) => p.price))))
  }
  if (plantilla.includes('{descuento}')) {
    const descuento = Math.max(0, ...catalogo.map((p) => calculateDiscountPercentage(p.originalPrice, p.price)))
    return descuento > 0 ? plantilla.replace('{descuento}', String(descuento)) : SIN_DESCUENTO
  }
  return plantilla
}

const conDatosReales = (promocion: Promotion): Promotion => ({
  ...promocion,
  discountText: resolverTexto(
    promocion.discountText,
    products.filter((p) => p.category === promocion.targetCategory),
  ),
})

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
  const promotions = useMemo(() => plantillas.map(conDatosReales), [])
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
