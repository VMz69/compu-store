import { Link } from 'react-router-dom'
import { CartItem } from './02-linea-carrito'
import { CartSummary } from '@/09-pipeline-checkout-whatsapp/00-director-checkout-whatsapp'
import { ConfirmDialog } from '@/05-pipeline-controles-compra/00-director-controles-compra'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { EmptyState } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { useCartView } from './03-estado-vista-carrito'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/08-pipeline-vista-carrito/04-vista-carrito.tsx'

export const CartView = () => {
  const cart = useCartView()

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs
        items={[{ label: 'Inicio', to: '/' }, { label: 'Carrito de Compras' }]}
        traceId="carrito.breadcrumbs"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Carrito de Compras
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tienes {cart.itemCount} producto(s) en tu orden
          </p>
        </div>
        {cart.items.length > 0 ? (
          <button
            type="button"
            onClick={cart.requestClearCart}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
            {...uiMeta({ id: 'carrito.vaciar', component: 'CartView', source: SOURCE })}
          >
            <i className="fa-regular fa-trash-can" /> Vaciar Carrito
          </button>
        ) : null}
      </div>

      {cart.items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          <div
            className="lg:col-span-8 space-y-4"
            {...uiMeta({ id: 'carrito.lista', component: 'CartView', source: SOURCE })}
          >
            {cart.items.map((item) => (
              <CartItem
                key={item.product.id}
                item={item}
                onIncrement={() => cart.increment(item)}
                onDecrement={() => cart.decrement(item)}
                onRemove={() => cart.remove(item)}
              />
            ))}
          </div>

          <CartSummary
            subtotal={cart.subtotal}
            total={cart.total}
            whatsappUrl={cart.whatsappUrl}
            deliveryMethod={cart.deliveryMethod}
            customerNote={cart.customerNote}
            onDeliveryChange={cart.setDeliveryMethod}
            onNoteChange={cart.setCustomerNote}
          />
        </div>
      ) : (
        <EmptyState
          icon="fa-solid fa-cart-shopping"
          title="Tu carrito está vacío"
          description="Explora nuestro catálogo y agrega los componentes que necesitas."
          traceId="carrito.empty"
          action={
            <Link
              to="/"
              className="bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-md transition-colors"
              {...uiMeta({ id: 'carrito.empty.cta', component: 'CartView', source: SOURCE })}
            >
              Explorar Catálogo
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={cart.isClearModalOpen}
        title="¿Vaciar el carrito?"
        description="Se eliminarán todos los productos de tu orden. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={cart.confirmClearCart}
        onCancel={cart.cancelClearCart}
      />
    </div>
  )
}
