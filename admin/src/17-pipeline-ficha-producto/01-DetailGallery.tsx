import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { ImageLightbox, SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductDetailApi } from '../16-pipeline-consulta-producto/02-useProductDetail'

const t = tracer('DetailGallery', 'src/features/catalog/components/detail/DetailGallery.tsx')

type DetailGalleryProps = Pick<ProductDetailApi, 'product' | 'gallery'>

/** Imagen principal ampliable + miniaturas. Clic en la principal abre el visor con zoom. */
export function DetailGallery({ product: p, gallery }: DetailGalleryProps) {
  const { images, active, select, viewer } = gallery
  const id = `catalog.product-detail.${p.id}.gallery`

  return (
    <div className="w-full sm:w-56 shrink-0 space-y-2" {...t(id)}>
      <button
        type="button"
        onClick={() => viewer.openViewer(active)}
        aria-label={`Ampliar imagen ${active + 1} de ${images.length}`}
        className="group relative block w-full h-48 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 cursor-zoom-in"
        {...t(`${id}.main`)}
      >
        <SafeImage key={images[active]} src={images[active]} alt={p.name} className="w-full h-full object-cover animate-fade-in" />
        {p.badge && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            {p.badge}
          </span>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold tabular-nums">
            {active + 1}/{images.length}
          </span>
        )}
        <span className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-slate-900/70 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          <i className="fa-solid fa-up-right-and-down-left-from-center text-[11px]" aria-hidden="true" />
        </span>
      </button>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-1.5">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(-24)}`}>
              <button
                type="button"
                onClick={() => select(i)}
                onDoubleClick={() => viewer.openViewer(i)}
                aria-label={`Mostrar imagen ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'block w-full aspect-square rounded-md overflow-hidden border-2 transition-all',
                  i === active ? 'border-brand' : 'border-transparent opacity-60 hover:opacity-100',
                )}
                {...t(`${id}.thumb.${i}`)}
              >
                <SafeImage src={src} alt="" className="w-full h-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewer.viewerIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={viewer.viewerIndex}
          title={p.name}
          traceId={`${id}.lightbox`}
          onClose={viewer.closeViewer}
        />
      )}
    </div>
  )
}
