import { createPortal } from 'react-dom'
import { ProductGalleryThumbs } from './ProductGalleryThumbs'
import { uiMeta } from '@/ui-traceability'
import type { ProductGalleryState } from '../../hooks/useProductGallery'

const SOURCE = 'src/features/catalog/components/detail/ProductLightbox.tsx'

const ROUND_BTN =
  'w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'

interface ProductLightboxProps {
  productName: string
  gallery: ProductGalleryState
}

export const ProductLightbox = ({ productName, gallery }: ProductLightboxProps) => {
  if (!gallery.isLightboxOpen) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${productName}`}
      onClick={gallery.closeLightbox}
      className="fixed inset-0 z-[70] flex flex-col bg-brand-midnight/95 backdrop-blur-sm animate-fade-in"
      {...uiMeta({ id: 'producto.detalle.lightbox', component: 'ProductLightbox', source: SOURCE })}
    >
      <div
        className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{productName}</p>
          <p className="text-[11px] text-slate-400">
            Foto {gallery.activeIndex + 1} de {gallery.total}
          </p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={gallery.closeLightbox}
          aria-label="Cerrar visor de fotos"
          className={ROUND_BTN}
          {...uiMeta({ id: 'producto.detalle.lightbox.cerrar', component: 'ProductLightbox', source: SOURCE })}
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-20 pb-4">
        <img
          key={gallery.activeImage}
          src={gallery.activeImage}
          alt={`${productName} — foto ${gallery.activeIndex + 1} de ${gallery.total}`}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-2xl bg-white shadow-2xl animate-fade-in"
        />

        {gallery.hasMultiple ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                gallery.prev()
              }}
              aria-label="Foto anterior"
              className={`${ROUND_BTN} absolute left-3 sm:left-6 top-1/2 -translate-y-1/2`}
              {...uiMeta({ id: 'producto.detalle.lightbox.anterior', component: 'ProductLightbox', source: SOURCE })}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                gallery.next()
              }}
              aria-label="Foto siguiente"
              className={`${ROUND_BTN} absolute right-3 sm:right-6 top-1/2 -translate-y-1/2`}
              {...uiMeta({ id: 'producto.detalle.lightbox.siguiente', component: 'ProductLightbox', source: SOURCE })}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </>
        ) : null}
      </div>

      {gallery.hasMultiple ? (
        <div className="px-4 pb-5" onClick={(event) => event.stopPropagation()}>
          <ProductGalleryThumbs
            images={gallery.images}
            activeIndex={gallery.activeIndex}
            productName={productName}
            traceId="producto.detalle.lightbox.thumbs"
            onSelect={gallery.select}
            variant="strip"
          />
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
