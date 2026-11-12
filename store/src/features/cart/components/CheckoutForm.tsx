import { uiMeta } from '@/04-trazabilidad-ui'
import type { DeliveryMethod } from '../types'

const SOURCE = 'src/features/cart/components/CheckoutForm.tsx'

interface CheckoutFormProps {
  deliveryMethod: DeliveryMethod
  customerNote: string
  onDeliveryChange: (method: DeliveryMethod) => void
  onNoteChange: (note: string) => void
}

const optionClass = (active: boolean) =>
  `flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
    active
      ? 'border-brand bg-brand-50/50 dark:bg-brand-950/60 text-brand-dark dark:text-brand-300 font-semibold'
      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
  }`

export const CheckoutForm = ({
  deliveryMethod,
  customerNote,
  onDeliveryChange,
  onNoteChange,
}: CheckoutFormProps) => (
  <div {...uiMeta({ id: 'carrito.checkout', component: 'CheckoutForm', source: SOURCE })}>
    <div className="space-y-2 text-xs">
      <span className="font-bold text-slate-700 dark:text-slate-300 block">
        Método de Entrega:
      </span>
      <label className={optionClass(deliveryMethod === 'pickup')}>
        <input
          type="radio"
          name="delivery"
          value="pickup"
          checked={deliveryMethod === 'pickup'}
          onChange={() => onDeliveryChange('pickup')}
          className="text-brand"
          {...uiMeta({
            id: 'carrito.checkout.delivery.pickup',
            component: 'CheckoutForm',
            source: SOURCE,
          })}
        />
        <div className="flex-1">
          <p className="font-bold">Retiro en Sala de Ventas</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Cojutepeque (Frente a Dollar City) - <b>GRATIS</b>
          </p>
        </div>
      </label>
      <label className={optionClass(deliveryMethod === 'shipping')}>
        <input
          type="radio"
          name="delivery"
          value="shipping"
          checked={deliveryMethod === 'shipping'}
          onChange={() => onDeliveryChange('shipping')}
          className="text-brand"
          {...uiMeta({
            id: 'carrito.checkout.delivery.shipping',
            component: 'CheckoutForm',
            source: SOURCE,
          })}
        />
        <div className="flex-1">
          <p className="font-bold">Envío a Domicilio</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Todo El Salvador (Costo a convenir)
          </p>
        </div>
      </label>
    </div>

    <div className="space-y-1.5 text-xs mt-4">
      <label
        htmlFor="cart-notes"
        className="font-bold text-slate-700 dark:text-slate-300 block"
      >
        Instrucciones o nota adicional:
      </label>
      <textarea
        id="cart-notes"
        rows={2}
        value={customerNote}
        onChange={(event) => onNoteChange(event.target.value)}
        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand focus:outline-none"
        placeholder="Ej. Deseo retirar hoy por la tarde..."
        {...uiMeta({
          id: 'carrito.checkout.note',
          component: 'CheckoutForm',
          source: SOURCE,
        })}
      />
    </div>
  </div>
)
