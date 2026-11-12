import { createPortal } from 'react-dom'
import { useLightbox } from '@/80-pipeline-galeria-imagenes/04-useLightbox'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { tracer } from '@/00-trazabilidad'
import { SafeImage } from '../81-pipeline-visualizacion-imagenes/00-director-visualizacion-imagenes'
import { LightboxThumbnails } from './03-LightboxThumbnails'
import { LightboxToolbar } from './02-LightboxToolbar'

const t = tracer('ImageLightbox', 'src/80-pipeline-galeria-imagenes/01-ImageLightbox.tsx')

interface ImageLightboxProps {
  images: string[]
  startIndex?: number
  /** Nombre del producto/elemento: título del visor y texto alternativo. */
  title: string
  /** Prefijo de trazabilidad (ej. "catalog.product-detail.PRD-001.lightbox"). */
  traceId: string
  onClose: () => void
}

const NAV_BUTTON =
  'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors'

/**
 * Visor de imágenes a pantalla completa con zoom, arrastre y navegación.
 * Se monta en `document.body` (portal) para no quedar recortado ni contenido
 * por el `transform` de animación del modal que lo abre.
 */
export function ImageLightbox({ images, startIndex = 0, title, traceId, onClose }: ImageLightboxProps) {
  const lightbox = useLightbox(images.length, startIndex, onClose)
  const { attachContainer, zoom, index, hasMany, prev, next, go } = lightbox
  const { attachStage, stageProps, imageStyle, isZoomed, isDragging } = zoom
  if (!images.length) return null

  return createPortal(
    <div
      ref={attachContainer}
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de imágenes: ${title}`}
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 backdrop-blur-sm animate-fade-in select-none"
      {...t(traceId)}
    >
      <LightboxToolbar lightbox={lightbox} title={title} traceId={traceId} onClose={onClose} />

      <div className="relative flex-1 min-h-0">
        <div
          ref={attachStage}
          {...stageProps}
          className={cn(
            'absolute inset-0 flex items-center justify-center overflow-hidden touch-none px-4 sm:px-16',
            isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
          )}
          {...t(`${traceId}.stage`)}
        >
          <SafeImage
            key={images[index]}
            src={images[index]}
            alt={`${title} — imagen ${index + 1}`}
            draggable={false}
            loading="eager"
            style={imageStyle}
            className="max-w-full max-h-full object-contain will-change-transform"
          />
        </div>

        {hasMany && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior (←)"
              className={cn(NAV_BUTTON, 'left-3')}
              onClick={prev}
              {...t(`${traceId}.prev`)}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente (→)"
              className={cn(NAV_BUTTON, 'right-3')}
              onClick={next}
              {...t(`${traceId}.next`)}
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[10px] text-white/40 pb-1 shrink-0 hidden sm:block">
        Rueda o doble clic para zoom · arrastra para mover · ← → para navegar · F pantalla completa · Esc para cerrar
      </p>
      {hasMany && <LightboxThumbnails images={images} active={index} traceId={traceId} onSelect={go} />}
    </div>,
    document.body,
  )
}
