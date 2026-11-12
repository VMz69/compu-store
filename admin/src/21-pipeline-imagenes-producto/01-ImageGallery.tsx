import { ImageLightbox } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ImageGalleryApi } from './04-useImageGallery'
import { ImageThumb } from './03-ImageThumb'

const t = tracer('ImageGallery', 'src/21-pipeline-imagenes-producto/01-ImageGallery.tsx')

interface ImageGalleryProps {
  gallery: ImageGalleryApi
  alt: string
  error?: string
}

/** Galería ordenable del producto. La primera imagen es la portada del catálogo. */
export function ImageGallery({ gallery, alt, error }: ImageGalleryProps) {
  const { rows, count, viewer } = gallery
  if (!count && !error) return null

  return (
    <section className="space-y-2" aria-labelledby="product-gallery-title" {...t('catalog.product-form.gallery')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 id="product-gallery-title" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Galería · {count} {count === 1 ? 'imagen' : 'imágenes'}
        </h4>
        <p className="text-[10px] text-slate-400">
          La primera es la portada. Usa <i className="fa-solid fa-star" aria-hidden="true" /> para cambiarla y las flechas para ordenar.
        </p>
      </div>

      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {rows.map((row, index) => (
          <ImageThumb
            key={row.id}
            row={row}
            index={index}
            count={count}
            alt={alt}
            onView={() => viewer.openViewer(index)}
            onMove={(offset) => gallery.move(row.id, offset)}
            onCover={() => gallery.makeCover(row.id)}
            onRemove={() => gallery.remove(row.id)}
          />
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-[11px] font-medium text-red-500">
          {error}
        </p>
      )}

      {viewer.viewerIndex !== null && (
        <ImageLightbox
          images={gallery.sources}
          startIndex={viewer.viewerIndex}
          title={alt || 'Producto nuevo'}
          traceId="catalog.product-form.gallery.lightbox"
          onClose={viewer.closeViewer}
        />
      )}
    </section>
  )
}
