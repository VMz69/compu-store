import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { tracer } from '@/00-trazabilidad'
import { SafeImage } from '../81-pipeline-visualizacion-imagenes/00-director-visualizacion-imagenes'

const t = tracer('LightboxThumbnails', 'src/80-pipeline-galeria-imagenes/03-LightboxThumbnails.tsx')

interface LightboxThumbnailsProps {
  images: string[]
  active: number
  traceId: string
  onSelect: (index: number) => void
}

/** Tira inferior de miniaturas para saltar directo a una imagen. */
export function LightboxThumbnails({ images, active, traceId, onSelect }: LightboxThumbnailsProps) {
  return (
    <div className="shrink-0 px-4 pb-4 pt-2 overflow-x-auto custom-scrollbar" {...t(`${traceId}.thumbnails`)}>
      <div className="flex justify-center gap-2 min-w-max mx-auto">
        {images.map((src, i) => (
          <button
            key={`${i}-${src.slice(-24)}`}
            type="button"
            aria-label={`Ver imagen ${i + 1}`}
            aria-current={i === active}
            onClick={() => onSelect(i)}
            className={cn(
              'w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
              i === active ? 'border-brand opacity-100' : 'border-transparent opacity-50 hover:opacity-90',
            )}
            {...t(`${traceId}.thumbnail.${i}`)}
          >
            <SafeImage src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
