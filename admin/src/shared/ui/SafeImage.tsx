import type { ImgHTMLAttributes } from 'react'
import { fallbackTo, FALLBACK_IMAGE } from '@/shared/lib/image'

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string
  fallback?: string
}

/** Imagen con reemplazo automático si la URL remota falla. */
export function SafeImage({ fallback = FALLBACK_IMAGE, alt, ...rest }: SafeImageProps) {
  return <img alt={alt} loading="lazy" onError={fallbackTo(fallback)} {...rest} />
}
