import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/00-director-acceso'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, validateCategory } from '../lib/taxonomy'
import { useCatalogStore } from '../store'
import type { Category } from '../types'

/** Alta/edición de categoría (payload del modal: categoría a editar o null). */
export function useCategoryForm() {
  const editing = useModalPayload<Category | null>()
  const categories = useCatalogStore((s) => s.categories)
  const saveCategory = useCatalogStore((s) => s.saveCategory)
  const isLoading = useCatalogStore((s) => s.isLoading)
  const [submitted, setSubmitted] = useState(false)
  const { values, bind, setField } = useFormState({
    name: editing?.name ?? '',
    icon: editing?.icon ?? CATEGORY_ICONS[0],
    description: editing?.description ?? '',
  })

  const errors = submitted ? validateCategory({ id: editing?.id, ...values }, categories) : {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateCategory({ id: editing?.id, ...values }, categories)).length > 0) return
    const permission = 'canManageTaxonomy'
    if (!ensurePermission(permission, editing ? 'No tienes permiso para editar categorías' : 'No tienes permiso para añadir categorías')) return
    const { category, created } = await saveCategory({
      id: editing?.id,
      name: values.name.trim(),
      icon: values.icon || DEFAULT_CATEGORY_ICON,
      description: values.description.trim(),
    })
    closeModal()
    toast(created ? `Categoría "${category.name}" creada` : `Categoría "${category.name}" actualizada`, 'success')
  }

  return {
    isEdit: Boolean(editing),
    /** El slug es fijo: forma parte de las URLs del Front Office. */
    slug: editing?.slug ?? null,
    values,
    bind,
    errors,
    icons: CATEGORY_ICONS,
    selectIcon: (icon: string) => setField('icon', icon),
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type CategoryFormApi = ReturnType<typeof useCategoryForm>
