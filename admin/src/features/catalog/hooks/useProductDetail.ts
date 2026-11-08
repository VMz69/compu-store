import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { getPricing, getStockSeverity } from '../lib/catalog.service'
import { useCatalogStore } from '../store'
import { useProductActions } from './useProductActions'

/** Ficha completa del producto abierto en el modal de detalle (payload = id). */
export function useProductDetail() {
  const productId = useModalPayload<string>()
  const product = useCatalogStore((s) => s.products.find((p) => p.id === productId))
  const { permissions, openEdit, promptDelete } = useProductActions()

  if (!product) return null

  return {
    product,
    pricing: getPricing(product),
    severity: getStockSeverity(product.stock, product.reorderPoint),
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    onEdit: () => openEdit(product),
    onDelete: () => promptDelete(product),
    onClose: closeModal,
  }
}

export type ProductDetailApi = NonNullable<ReturnType<typeof useProductDetail>>
