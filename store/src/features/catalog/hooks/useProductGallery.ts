import { useEffect, useState } from 'react'

/**
 * Estado de la galería de detalle: foto activa y visor a pantalla completa.
 * Con el visor abierto bloquea el scroll del body y atiende el teclado
 * (Esc cierra, flechas navegan).
 */
export const useProductGallery = (images: string[]) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const total = images.length
  const hasMultiple = total > 1

  const select = (index: number) => setActiveIndex(((index % total) + total) % total)
  const next = () => select(activeIndex + 1)
  const prev = () => select(activeIndex - 1)
  const openLightbox = () => setIsLightboxOpen(true)
  const closeLightbox = () => setIsLightboxOpen(false)

  useEffect(() => {
    if (!isLightboxOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false)
      if (event.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % total)
      if (event.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + total) % total)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isLightboxOpen, total])

  return {
    images,
    activeIndex,
    activeImage: images[activeIndex] ?? images[0],
    total,
    hasMultiple,
    isLightboxOpen,
    select,
    next,
    prev,
    openLightbox,
    closeLightbox,
  }
}

export type ProductGalleryState = ReturnType<typeof useProductGallery>
