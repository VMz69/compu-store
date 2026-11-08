import type { SyntheticEvent } from 'react'
import { publicUrl } from './publicUrl'

export const FALLBACK_IMAGE = publicUrl('logo/icono.png')

/** Handler `onError` que reemplaza la imagen una sola vez (evita bucles si el fallback falla). */
export const fallbackTo =
  (src: string = FALLBACK_IMAGE) =>
  (event: SyntheticEvent<HTMLImageElement>): void => {
    const img = event.currentTarget
    if (img.dataset.fallback) return
    img.dataset.fallback = 'true'
    img.src = src
  }
