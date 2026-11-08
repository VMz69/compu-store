import type { FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { useCatalogStore } from '@/features/catalog'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { usePromotionsStore } from '../store'

type OfferFormValues = {
  title: string
  badge: string
  discountText: string
  targetCategory: string
  description: string
}

/** Formulario "Nueva Campaña Promocional". */
export function useOfferForm() {
  const categories = useCatalogStore((s) => s.categories)
  const addPromotion = usePromotionsStore((s) => s.addPromotion)
  const isLoading = usePromotionsStore((s) => s.isLoading)
  const { values, bind } = useFormState<OfferFormValues>({
    title: '',
    badge: 'OFERTA ESPECIAL',
    discountText: '25% DESCUENTO',
    targetCategory: categories[0]?.id ?? 'computadoras',
    description: '',
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensurePermission('canCreateProduct', 'Su rol no puede añadir campañas')) return
    const promotion = await addPromotion({
      title: values.title.trim(),
      badge: values.badge.trim() || 'OFERTA ESPECIAL',
      discountText: values.discountText.trim() || 'DESCUENTO',
      targetCategory: values.targetCategory,
      description: values.description.trim(),
    })
    closeModal()
    toast(`Campaña "${promotion.title}" creada`, 'success')
  }

  return {
    bind,
    categoryOptions: categories.map((c) => ({ value: c.id, label: c.name })),
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}
