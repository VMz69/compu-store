import { createPortal } from 'react-dom'
import { useMobileActionBar } from './03-estado-compra-movil'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/24-pipeline-compra-producto/04-barra-compra-movil.tsx'

interface ProductMobileBarProps {
  productId: number
  isOutOfStock: boolean
  canAddToCart: boolean
  quantity: number
  subtotal: number
  whatsappUrl: string
  onAddToCart: () => void
}

/** Barra de compra fija inferior, solo en móvil/tablet (< lg). Va en portal para no heredar transforms del layout. */
export const ProductMobileBar = ({
  productId,
  isOutOfStock,
  canAddToCart,
  quantity,
  subtotal,
  whatsappUrl,
  onAddToCart,
}: ProductMobileBarProps) => {
  useMobileActionBar(!isOutOfStock)
  if (isOutOfStock) return null

  const traceId = `producto.detalle.${productId}.barra-movil`

  return createPortal(
    <div
      role="region"
      aria-label="Acciones de compra"
      className="lg:hidden fixed inset-x-0 bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_24px_-12px_rgba(12,25,44,0.18)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      {...uiMeta({ id: traceId, component: 'ProductMobileBar', source: SOURCE })}
    >
      <div className="max-w-xl mx-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAddToCart}
          aria-label={`Agregar ${quantity} al carrito`}
          className="h-12 px-4 shrink-0 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          {...uiMeta({ id: `${traceId}.agregar`, component: 'ProductMobileBar', source: SOURCE })}
        >
          <i className="fa-solid fa-cart-plus text-base" />
          <span>Agregar</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 flex-1 min-w-0 rounded-xl bg-whatsapp hover:bg-whatsapp-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          {...uiMeta({ id: `${traceId}.whatsapp`, component: 'ProductMobileBar', source: SOURCE })}
        >
          <i className="fa-brands fa-whatsapp text-lg" />
          <span className="truncate">
            Comprar <span aria-hidden="true">·</span> {formatCurrency(subtotal)}
          </span>
        </a>
      </div>
    </div>,
    document.body,
  )
}
