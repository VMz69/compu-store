import type { FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { useCatalogStore } from '../store'

type CategoryFormValues = { name: string; icon: string; description: string }

export function useCategoryForm() {
  const addCategory = useCatalogStore((s) => s.addCategory)
  const isLoading = useCatalogStore((s) => s.isLoading)
  const { values, bind } = useFormState<CategoryFormValues>({
    name: '',
    icon: 'fa-solid fa-network-wired',
    description: '',
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensurePermission('canCreateProduct', 'Su rol no puede añadir categorías')) return
    const category = await addCategory({
      name: values.name.trim(),
      icon: values.icon.trim() || 'fa-solid fa-folder',
      description: values.description.trim(),
    })
    closeModal()
    toast(`Categoría "${category.name}" agregada`, 'success')
  }

  return { bind, onSubmit, onClose: closeModal, isLoading }
}
