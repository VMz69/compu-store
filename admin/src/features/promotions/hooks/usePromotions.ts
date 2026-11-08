import { usePermission } from '@/features/access'
import { useShowCategoryProducts } from '@/features/catalog'
import { openModal } from '@/shared/store/modal.store'
import { PROMOTIONS_MODALS } from '../modals'
import { usePromotionsStore } from '../store'

/** Datos de la vista Ofertas Web: campañas activas y acciones. */
export function usePromotions() {
  const promotions = usePromotionsStore((s) => s.promotions)
  const canCreate = usePermission('canCreateProduct')
  const showItems = useShowCategoryProducts()

  return {
    promotions,
    canCreate,
    showItems,
    openCreate: () => openModal(PROMOTIONS_MODALS.offerForm),
  }
}
