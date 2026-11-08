import { FormActions, Modal, ModalHeader, ModalTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useOrderForm } from '../../hooks/useOrderForm'
import { OrderFormFields } from './OrderFormFields'

const t = tracer('OrderFormModal', 'src/features/sales/components/form/OrderFormModal.tsx')

export function OrderFormModal() {
  const { onSubmit, onClose, isLoading, hasProducts, ...fields } = useOrderForm()

  return (
    <Modal
      onClose={onClose}
      widthClass="w-[min(94vw,540px)]"
      className="max-h-[90vh]"
      {...t('sales.order-form')}
    >
      <ModalHeader onClose={onClose} closeMeta={t('sales.order-form.close')}>
        <ModalTitle icon="fa-solid fa-cart-plus">Registrar Nuevo Pedido / Venta</ModalTitle>
      </ModalHeader>

      <form
        onSubmit={onSubmit}
        className="p-5 overflow-y-auto custom-scrollbar space-y-3.5 text-xs"
        {...t('sales.order-form.form')}
      >
        {!hasProducts && (
          <p className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold">
            No hay productos con existencias disponibles para registrar un pedido.
          </p>
        )}
        <OrderFormFields {...fields} />
        <FormActions
          onCancel={onClose}
          submitLabel="Registrar Orden"
          isLoading={isLoading}
          cancelMeta={t('sales.order-form.cancel')}
          submitMeta={t('sales.order-form.submit')}
        />
      </form>
    </Modal>
  )
}
