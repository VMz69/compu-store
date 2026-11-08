import { Field, Input, Select, SwitchField } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ProductFormApi } from '../../../hooks/useProductForm'
import { ImageDropzone } from './ImageDropzone'

const t = tracer('GeneralTab', 'src/features/catalog/components/form/tabs/GeneralTab.tsx')

/** Sección 1 · Identificación del producto, imagen y visibilidad web. */
export function GeneralTab({ api }: { api: ProductFormApi }) {
  const { form, image, errors, categoryOptions, conditionOptions } = api
  const { bind, values } = form

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
        <ImageDropzone imageUrl={values.imageUrl} alt={values.name} picker={image} onChange={form.setImage} />

        <div className="space-y-4">
          <Field label="Nombre del producto" variant="caps" required error={errors.name}>
            <Input
              placeholder="Ej. Laptop HP ProBook 450 G8 Core i5"
              invalid={Boolean(errors.name)}
              autoFocus
              {...bind('name')}
              {...t('catalog.product-form.name')}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categoría" variant="caps" required error={errors.category}>
              <Select
                options={categoryOptions}
                className="w-full"
                invalid={Boolean(errors.category)}
                {...bind('category')}
                {...t('catalog.product-form.category')}
              />
            </Field>
            <Field
              label="Código / SKU"
              variant="caps"
              error={errors.sku}
              hint="Si lo dejas vacío se genera automáticamente."
            >
              <Input
                placeholder="Ej. HP-450G8-I5"
                className="font-mono uppercase"
                invalid={Boolean(errors.sku)}
                {...bind('sku')}
                {...t('catalog.product-form.sku')}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Marca" variant="caps" required error={errors.brand}>
              <Input
                placeholder="Ej. HP, Kingston"
                invalid={Boolean(errors.brand)}
                {...bind('brand')}
                {...t('catalog.product-form.brand')}
              />
            </Field>
            <Field label="Modelo" variant="caps">
              <Input placeholder="Ej. ProBook 450 G8" {...bind('model')} {...t('catalog.product-form.model')} />
            </Field>
            <Field label="Condición" variant="caps">
              <Select
                options={conditionOptions}
                className="w-full"
                {...bind('condition')}
                {...t('catalog.product-form.condition')}
              />
            </Field>
          </div>
        </div>
      </div>

      <SwitchField
        icon="fa-solid fa-globe text-brand"
        title="Visible en la Tienda Web"
        description="Si lo desactivas, el producto se oculta del catálogo público pero sigue disponible en el inventario interno."
        {...form.bindActive}
        {...t('catalog.product-form.active')}
      />
    </div>
  )
}
