import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/00-director-acceso'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { productsOfBrand, validateBrand } from '../25-pipeline-persistencia-catalogo/03-taxonomy'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'
import type { Brand } from '../25-pipeline-persistencia-catalogo/04-types'

/** Alta/edición de marca (payload del modal: marca a editar o null). */
export function useBrandForm() {
  const editing = useModalPayload<Brand | null>()
  const brands = useCatalogStore((s) => s.brands)
  const products = useCatalogStore((s) => s.products)
  const saveBrand = useCatalogStore((s) => s.saveBrand)
  const isLoading = useCatalogStore((s) => s.isLoading)
  const [submitted, setSubmitted] = useState(false)
  const { values, bind, bindCheck } = useFormState({
    name: editing?.name ?? '',
    website: editing?.website ?? '',
    description: editing?.description ?? '',
    active: editing?.active ?? true,
  })

  const fields = { id: editing?.id, name: values.name, website: values.website, description: values.description }
  const errors = submitted ? validateBrand(fields, brands) : {}
  const productCount = editing ? productsOfBrand(products, editing.name).length : 0
  const renaming = Boolean(editing) && values.name.trim() !== '' && values.name.trim() !== editing?.name

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateBrand(fields, brands)).length > 0) return
    const permission = 'canManageTaxonomy'
    if (!ensurePermission(permission, editing ? 'No tienes permiso para editar marcas' : 'No tienes permiso para añadir marcas')) return
    const { brand, created, renamed } = await saveBrand({
      id: editing?.id,
      name: values.name.trim(),
      website: values.website.trim(),
      description: values.description.trim(),
      active: values.active,
    })
    closeModal()
    toast(
      created ? `Marca "${brand.name}" creada` : renamed ? `Marca actualizada · ${renamed} producto(s) renombrados` : `Marca "${brand.name}" actualizada`,
      'success',
    )
  }

  return {
    isEdit: Boolean(editing),
    bind,
    bindCheck,
    errors,
    active: values.active,
    /** Aviso de cascada: renombrar actualiza la marca en sus productos. */
    renameNotice: renaming && productCount > 0 ? `Se actualizará la marca en ${productCount} producto(s).` : null,
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type BrandFormApi = ReturnType<typeof useBrandForm>
