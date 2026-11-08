import { Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useCategoryForm } from '../../hooks/useCategoryForm'

const t = tracer('CategoryFormModal', 'src/features/catalog/components/categories/CategoryFormModal.tsx')

export function CategoryFormModal() {
  const { bind, onSubmit, onClose, isLoading } = useCategoryForm()

  return (
    <Modal onClose={onClose} widthClass="w-[min(94vw,460px)]" {...t('catalog.category-form')}>
      <ModalHeader onClose={onClose} closeMeta={t('catalog.category-form.close')}>
        <ModalTitle icon="fa-solid fa-folder-plus">Nueva Categoría</ModalTitle>
      </ModalHeader>

      <form onSubmit={onSubmit} className="p-5 space-y-3.5 text-xs" {...t('catalog.category-form.form')}>
        <Field label="Nombre de Categoría *">
          <Input
            required
            placeholder="Ej. Redes & Conectividad"
            {...bind('name')}
            {...t('catalog.category-form.name')}
          />
        </Field>
        <Field label="Ícono FontAwesome">
          <Input {...bind('icon')} {...t('catalog.category-form.icon')} />
        </Field>
        <Field label="Descripción Breve">
          <Textarea
            placeholder="Routers, switches, antenas y cables de red..."
            {...bind('description')}
            {...t('catalog.category-form.description')}
          />
        </Field>

        <FormActions
          onCancel={onClose}
          submitLabel="Guardar Categoría"
          isLoading={isLoading}
          cancelMeta={t('catalog.category-form.cancel')}
          submitMeta={t('catalog.category-form.submit')}
        />
      </form>
    </Modal>
  )
}
