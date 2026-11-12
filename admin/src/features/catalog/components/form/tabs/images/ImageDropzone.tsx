import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ImageGalleryApi } from '../../../../hooks/form/useImageGallery'
import { formatMegabytes, MAX_IMAGE_BYTES } from '../../../../lib/productImages'
import { ImageUrlInput } from './ImageUrlInput'

const t = tracer('ImageDropzone', 'src/features/catalog/components/form/tabs/images/ImageDropzone.tsx')

interface ImageDropzoneProps {
  gallery: ImageGalleryApi
  alt: string
}

/**
 * Portada + zona para agregar imágenes (arrastrar/soltar varias, clic o URL).
 * El `<label>` envuelve al input de archivo, así el clic abre el selector sin refs.
 */
export function ImageDropzone({ gallery, alt }: ImageDropzoneProps) {
  const { picker, sources, count, max, isFull } = gallery
  const cover = sources[0]

  return (
    <div className="space-y-2" {...t('catalog.product-form.image')}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Imágenes del producto
        </span>
        <span className={cn('text-[10px] font-bold tabular-nums', isFull ? 'text-amber-600' : 'text-slate-400')}>
          {count}/{max}
        </span>
      </div>

      <label
        {...picker.dropProps}
        aria-disabled={isFull}
        className={cn(
          'group relative flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed overflow-hidden transition-colors',
          isFull ? 'cursor-not-allowed' : 'cursor-pointer',
          picker.isDragging
            ? 'border-brand bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-brand',
        )}
        {...t('catalog.product-form.image.drop')}
      >
        <input className="sr-only" {...picker.inputProps} {...t('catalog.product-form.image.input')} />
        {cover ? (
          <>
            <SafeImage key={cover} src={cover} alt={alt || 'Portada'} className="w-full h-full object-cover" />
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-brand text-white text-[9px] font-black uppercase tracking-wider">
              Portada
            </span>
            <span className="absolute inset-0 bg-slate-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1.5 text-center px-3">
              <i className={isFull ? 'fa-solid fa-ban' : 'fa-solid fa-plus'} aria-hidden="true" />
              {isFull ? `Galería completa (máx. ${max})` : 'Agregar más imágenes'}
            </span>
          </>
        ) : (
          <div className="text-center px-3">
            <i className="fa-solid fa-images text-2xl text-slate-400 group-hover:text-brand transition-colors" aria-hidden="true" />
            <p className="mt-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Arrastra imágenes o <span className="text-brand">haz clic</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Hasta {max} · JPG, PNG o WebP · máx. {formatMegabytes(MAX_IMAGE_BYTES)} c/u
            </p>
          </div>
        )}
      </label>

      <ImageUrlInput entry={gallery.urlEntry} disabled={isFull} />
    </div>
  )
}
