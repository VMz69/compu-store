import { cn } from '@/shared/lib/cn'
import { Input, SafeImage } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ImagePicker } from '../../../hooks/form/useImagePicker'

const t = tracer('ImageDropzone', 'src/features/catalog/components/form/tabs/ImageDropzone.tsx')

interface ImageDropzoneProps {
  imageUrl: string
  alt: string
  picker: ImagePicker
  onChange: (url: string) => void
}

/**
 * Imagen del producto: arrastrar/soltar, clic para elegir archivo o pegar URL.
 * El `<label>` envuelve al input de archivo, así el clic abre el selector sin refs.
 */
export function ImageDropzone({ imageUrl, alt, picker, onChange }: ImageDropzoneProps) {
  const isLocal = imageUrl.startsWith('data:')

  return (
    <div className="space-y-2" {...t('catalog.product-form.image')}>
      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Imagen del producto
      </span>
      <label
        {...picker.dropProps}
        className={cn(
          'group relative flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors',
          picker.isDragging
            ? 'border-brand bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-brand',
        )}
        {...t('catalog.product-form.image.drop')}
      >
        <input className="sr-only" {...picker.inputProps} />
        {imageUrl ? (
          <>
            <SafeImage src={imageUrl} alt={alt || 'Vista previa'} className="w-full h-full object-cover" />
            <span className="absolute inset-0 bg-slate-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1.5">
              <i className="fa-solid fa-arrows-rotate" aria-hidden="true" /> Cambiar imagen
            </span>
          </>
        ) : (
          <div className="text-center px-3">
            <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 group-hover:text-brand transition-colors" aria-hidden="true" />
            <p className="mt-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Arrastra una imagen o <span className="text-brand">haz clic</span>
            </p>
            <p className="text-[10px] text-slate-400">JPG, PNG o WebP · máx. 1.5 MB</p>
          </div>
        )}
      </label>

      <div className="flex items-center gap-1.5">
        <Input
          type="url"
          value={isLocal ? '' : imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLocal ? 'Imagen local cargada' : 'o pega una URL https://…'}
          aria-label="URL de la imagen"
          {...t('catalog.product-form.image.url')}
        />
        {imageUrl && (
          <button
            type="button"
            title="Quitar imagen"
            aria-label="Quitar imagen"
            className="w-8 h-8 shrink-0 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            onClick={() => onChange('')}
            {...t('catalog.product-form.image.clear')}
          >
            <i className="fa-solid fa-trash text-xs" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
