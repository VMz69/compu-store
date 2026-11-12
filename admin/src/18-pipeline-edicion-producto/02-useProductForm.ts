import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/00-director-acceso'
import { useTabs } from '@/76-pipeline-avisos-globales/04-useTabs'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { getCommercialSummary } from '../23-pipeline-seleccion-productos/04-commercial'
import { CONDITION_OPTIONS, PRODUCT_FORM_TAB_IDS, sumLotRows, toDraft, toFormValues } from '../20-pipeline-validacion-producto/00-director-validacion-producto'
import { countErrorsByTab, tabOfError, validateProduct } from '../20-pipeline-validacion-producto/02-productValidation'
import { brandOptions } from '../25-pipeline-persistencia-catalogo/03-taxonomy'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'
import { useImageGallery } from '../21-pipeline-imagenes-producto/04-useImageGallery'
import { useProductFormState } from './03-useProductFormState'

/**
 * Orquestador del modal de producto (alta/edición en 4 secciones).
 *
 * Flujo:
 * 1. El payload del modal es el producto a editar o `null` para alta.
 * 2. Los errores se muestran solo después del primer intento de guardar y a
 *    partir de ahí se recalculan en vivo (se corrigen mientras se escribe).
 * 3. Si hay errores, se salta a la primera sección con problemas.
 * 4. Cerrar con cambios sin guardar pide confirmación.
 */
export function useProductForm() {
  const product = useModalPayload<Product | null>()
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const brands = useCatalogStore((s) => s.brands)
  const saveProduct = useCatalogStore((s) => s.saveProduct)
  const isLoading = useCatalogStore((s) => s.isLoading)

  // Inicialización perezosa: las filas reciben ids estables una sola vez.
  const [initial] = useState(() => toFormValues(product, categories))
  const form = useProductFormState(initial)
  const tabs = useTabs(PRODUCT_FORM_TAB_IDS)
  const gallery = useImageGallery(form.values.images, form.updateImages)
  const [submitted, setSubmitted] = useState(false)

  const isEdit = Boolean(product)
  const errors = submitted ? validateProduct(form.values, products) : {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const firstError = Object.keys(validateProduct(form.values, products))[0]
    if (firstError) {
      tabs.select(tabOfError(firstError))
      toast('Revisa los campos marcados antes de guardar.', 'warning')
      return
    }
    const allowed = isEdit
      ? ensurePermission('canEditProduct', 'Permiso denegado para editar productos')
      : ensurePermission('canCreateProduct', 'Permiso denegado para crear productos')
    if (!allowed) return
    const result = await saveProduct(toDraft(form.values))
    closeModal()
    toast(result === 'updated' ? 'Producto actualizado exitosamente' : 'Nuevo producto añadido al catálogo', 'success')
  }

  const requestClose = () => {
    if (!form.isDirty) return closeModal()
    askConfirm({
      title: '¿Descartar cambios?',
      message: 'Hay cambios sin guardar en este producto. Si cierras ahora, se perderán.',
      confirmText: 'Descartar',
      onConfirm: closeModal,
    })
  }

  return {
    isEdit,
    title: isEdit ? 'Editar producto' : 'Nuevo producto',
    subtitle: isEdit
      ? `SKU ${product?.sku} · ${product?.name}`
      : 'Completa las 4 secciones. Los campos con * son obligatorios.',
    form,
    tabs,
    gallery,
    errors,
    errorCounts: countErrorsByTab(errors),
    summary: getCommercialSummary(form.values),
    computedStock: sumLotRows(form.values.lots),
    categoryOptions: categories.map((c) => ({ value: c.id, label: c.name })),
    /** Marcas activas del catálogo (se administran en /categorias?tab=marcas). */
    brandOptions: brandOptions(brands, initial.brand),
    conditionOptions: CONDITION_OPTIONS,
    onSubmit,
    onClose: requestClose,
    isLoading,
  }
}

export type ProductFormApi = ReturnType<typeof useProductForm>
