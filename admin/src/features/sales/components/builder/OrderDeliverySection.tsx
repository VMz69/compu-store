import { Field, Input, Select, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OrderBuilderApi } from '../../hooks/useOrderBuilder'

const t = tracer('OrderDeliverySection', 'src/features/sales/components/builder/OrderDeliverySection.tsx')

/** Paso 3 · Canal, pago, entrega y notas del pedido. */
export function OrderDeliverySection({ b }: { b: OrderBuilderApi }) {
  return (
    <section className="space-y-3" {...t('sales.builder.delivery')}>
      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">3 · Venta y entrega</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Canal de venta" variant="caps" required error={b.errors.channel}>
          <Select options={b.channelOptions} className="w-full" invalid={Boolean(b.errors.channel)} {...b.bind('channel')} {...t('sales.builder.channel')} />
        </Field>
        <Field label="Forma de pago" variant="caps" required error={b.errors.paymentMethod}>
          <Select options={b.paymentOptions} className="w-full" {...b.bind('paymentMethod')} {...t('sales.builder.payment')} />
        </Field>
        <Field label="Entrega" variant="caps" required error={b.errors.deliveryMethod}>
          <Select options={b.deliveryOptions} className="w-full" {...b.bind('deliveryMethod')} {...t('sales.builder.delivery-method')} />
        </Field>
        <Field label="Ciudad / municipio" variant="caps">
          <Input placeholder={b.cityPlaceholder} {...b.bind('city')} {...t('sales.builder.city')} />
        </Field>
      </div>
      <Field label="Notas internas" variant="caps">
        <Textarea className="h-14" placeholder="Ej. Llamar antes de enviar. Requiere CCF." {...b.bind('notes')} {...t('sales.builder.notes')} />
      </Field>
    </section>
  )
}
