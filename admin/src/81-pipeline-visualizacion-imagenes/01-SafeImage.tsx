import type { ImgHTMLAttributes } from 'react'
import { fallbackTo, FALLBACK_IMAGE } from '@/81-pipeline-visualizacion-imagenes/04-image'

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string
  fallback?: string
}

/** Imagen con reemplazo automático si la URL remota falla. */
export function SafeImage({ fallback = FALLBACK_IMAGE, alt, ...rest }: SafeImageProps) {
  return <img alt={alt} loading="lazy" onError={fallbackTo(fallback)} {...rest} />
}
