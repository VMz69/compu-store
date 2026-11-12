import { ProductGalleryThumbs } from './02-miniaturas'
import { ProductLightbox } from './03-visor-imagenes'
import { useProductGallery } from './01-estado-galeria'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/18-pipeline-galeria-producto/04-galeria.tsx'

interface ProductGalleryProps {
  productName: string
  images: string[]
  discount: number
}

export const ProductGallery = ({ productName, images, discount }: ProductGalleryProps) => {
  const gallery = useProductGallery(images)

  return (
    <div
      className="min-w-0 flex flex-col"
      {...uiMeta({ id: 'producto.detalle.galeria', component: 'ProductGallery', source: SOURCE })}
    >
      <div className="flex flex-col-reverse sm:flex-row gap-3 xl:flex-1">
        {gallery.hasMultiple ? (
          <ProductGalleryThumbs
            images={gallery.images}
            activeIndex={gallery.activeIndex}
            productName={productName}
            traceId="producto.detalle.galeria.thumbs"
            onSelect={gallery.select}
          />
        ) : null}

        <button
          type="button"
          onClick={gallery.openLightbox}
          aria-label={`Ver fotos de ${productName} en pantalla completa`}
          title="Clic para ver en pantalla completa"
          className="relative flex-1 min-w-0 aspect-[4/3] xl:aspect-auto xl:min-h-80 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-center overflow-hidden group cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          {...uiMeta({
            id: 'producto.detalle.galeria.principal',
            component: 'ProductGallery',
            source: SOURCE,
          })}
        >
          {discount > 0 ? (
            <span className="absolute top-4 left-4 z-10 bg-amber-400 text-amber-950 text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
              Ahorras {discount}%
            </span>
          ) : null}

          <img
            key={gallery.activeImage}
            src={gallery.activeImage}
            alt={`${productName} — foto ${gallery.activeIndex + 1} de ${gallery.total}`}
            className="max-h-full max-w-full object-contain rounded-lg animate-fade-in group-hover:scale-[1.03] transition-transform duration-500"
          />

          {gallery.hasMultiple ? (
            <span className="absolute bottom-4 left-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-full shadow-xs">
              {gallery.activeIndex + 1} / {gallery.total}
            </span>
          ) : null}

          <span className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-200 group-hover:text-brand shadow-sm flex items-center justify-center transition-colors">
            <i className="fa-solid fa-expand text-sm" />
          </span>
        </button>
      </div>

      <ProductLightbox productName={productName} gallery={gallery} />
    </div>
  )
}
