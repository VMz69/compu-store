import { Field, Input, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderFormApi } from '../../hooks/useOrderForm'

const t = tracer('OrderFormFields', 'src/features/sales/components/form/OrderFormFields.tsx')

type OrderFormFieldsProps = Omit<OrderFormApi, 'onSubmit' | 'onClose' | 'isLoading' | 'hasProducts'>

export function OrderFormFields(props: OrderFormFieldsProps) {
  const { bind, maxQuantity, channelOptions, productOptions, paymentOptions, statusOptions } = props

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre del Cliente *">
          <Input required placeholder="Ej. Marvin Castro" {...bind('client')} {...t('sales.order-form.client')} />
        </Field>
        <Field label="Teléfono de Contacto *">
          <Input required placeholder="Ej. 7038-8225" {...bind('phone')} {...t('sales.order-form.phone')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Canal de Venta *">
          <Select options={channelOptions} className="w-full" {...bind('channel')} {...t('sales.order-form.channel')} />
        </Field>
        <Field label="Municipio / Ciudad">
          <Input {...bind('city')} {...t('sales.order-form.city')} />
        </Field>
      </div>

      <Field label="Producto Principal *">
        <Select
          required
          options={productOptions}
          className="w-full"
          {...bind('productId')}
          {...t('sales.order-form.product')}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Cantidad">
          <Input
            type="number"
            min="1"
            max={maxQuantity}
            required
            {...bind('quantity')}
            {...t('sales.order-form.quantity')}
          />
        </Field>
        <Field label="Método de Pago">
          <Select options={paymentOptions} className="w-full" {...bind('paymentMethod')} {...t('sales.order-form.payment')} />
        </Field>
        <Field label="Estado Inicial">
          <Select options={statusOptions} className="w-full" {...bind('status')} {...t('sales.order-form.status')} />
        </Field>
      </div>

      <Field label="Método y Lugar de Entrega">
        <Input {...bind('deliveryMethod')} {...t('sales.order-form.delivery')} />
      </Field>
    </>
  )
}
