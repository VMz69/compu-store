import { CheckoutForm } from './CheckoutForm'
import { formatCurrency } from '@/shared/lib/formatters'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { DeliveryMethod } from '../types'

const SOURCE = 'src/features/cart/components/CartSummary.tsx'

interface CartSummaryProps {
  subtotal: number
  total: number
  whatsappUrl: string
  deliveryMethod: DeliveryMethod
  customerNote: string
  onDeliveryChange: (method: DeliveryMethod) => void
  onNoteChange: (note: string) => void
}

export const CartSummary = ({
  subtotal,
  total,
  whatsappUrl,
  deliveryMethod,
  customerNote,
  onDeliveryChange,
  onNoteChange,
}: CartSummaryProps) => (
  <div
    className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-5"
    {...uiMeta({ id: 'carrito.resumen', component: 'CartSummary', source: SOURCE })}
  >
    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
      Resumen de Orden
    </h3>

    <CheckoutForm
      deliveryMethod={deliveryMethod}
      customerNote={customerNote}
      onDeliveryChange={onDeliveryChange}
      onNoteChange={onNoteChange}
    />

    <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
      <div className="flex justify-between">
        <span>Subtotal artículos:</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {formatCurrency(subtotal)}
        </span>
      </div>
      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
        <span>Retiro en Tienda:</span>
        <span className="font-bold">GRATIS</span>
      </div>
      <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-2">
        <span>Total Estimado:</span>
        <span className="text-brand-dark dark:text-sky-400">{formatCurrency(total)}</span>
      </div>
    </div>

    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-whatsapp hover:bg-whatsapp-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
      {...uiMeta({
        id: 'carrito.resumen.whatsapp',
        component: 'CartSummary',
        source: SOURCE,
      })}
    >
      <i className="fa-brands fa-whatsapp text-lg" />
      <span>Completar Pedido por WhatsApp</span>
    </a>
  </div>
)
