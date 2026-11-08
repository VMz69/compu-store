import { Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Select, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useOfferForm } from '../hooks/useOfferForm'

const t = tracer('OfferFormModal', 'src/features/promotions/components/OfferFormModal.tsx')

export function OfferFormModal() {
  const { bind, categoryOptions, onSubmit, onClose, isLoading } = useOfferForm()

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,460px)]" {...t('promotions.offer-form')}>
      <ModalHeader onClose={onClose} closeMeta={t('promotions.offer-form.close')}>
        <ModalTitle icon="fa-solid fa-tag">Nueva Campaña Promocional</ModalTitle>
      </ModalHeader>

      <form onSubmit={onSubmit} className="p-5 space-y-3.5 text-xs" {...t('promotions.offer-form.form')}>
        <Field label="Título de Campaña *">
          <Input
            required
            placeholder="Ej. MONITORES GAMER 144HZ"
            {...bind('title')}
            {...t('promotions.offer-form.title')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Insignia / Badge">
            <Input {...bind('badge')} {...t('promotions.offer-form.badge')} />
          </Field>
          <Field label="Texto de Descuento">
            <Input {...bind('discountText')} {...t('promotions.offer-form.discount')} />
          </Field>
        </div>
        <Field label="Categoría Destino">
          <Select
            options={categoryOptions}
            className="w-full"
            {...bind('targetCategory')}
            {...t('promotions.offer-form.category')}
          />
        </Field>
        <Field label="Descripción Breve">
          <Textarea
            placeholder="Aprovecha descuentos directos con garantía local en Cojutepeque..."
            {...bind('description')}
            {...t('promotions.offer-form.description')}
          />
        </Field>

        <FormActions
          onCancel={onClose}
          submitLabel="Guardar Promoción"
          isLoading={isLoading}
          cancelMeta={t('promotions.offer-form.cancel')}
          submitMeta={t('promotions.offer-form.submit')}
        />
      </form>
    </Modal>
  )
}
