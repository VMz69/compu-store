import { useState } from 'react'
import { useImageViewer } from '@/shared/hooks/useImageViewer'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { getPricing, getStockSeverity } from '../lib/catalog.service'
import { displayImages } from '../lib/productImages'
import { useCatalogStore } from '../store'
import { useProductActions } from './useProductActions'

/** Ficha completa del producto abierto en el modal de detalle (payload = id). */
export function useProductDetail() {
  const productId = useModalPayload<string>()
  const product = useCatalogStore((s) => s.products.find((p) => p.id === productId))
  const { permissions, openEdit, promptDelete } = useProductActions()
  const [activeImage, setActiveImage] = useState(0)
  const viewer = useImageViewer()

  if (!product) return null
  const images = displayImages(product.images)

  return {
    product,
    pricing: getPricing(product),
    severity: getStockSeverity(product.stock, product.reorderPoint),
    gallery: {
      images,
      // Si la galería se acortó (edición), el índice vuelve a la portada.
      active: activeImage < images.length ? activeImage : 0,
      select: setActiveImage,
      viewer,
    },
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    onEdit: () => openEdit(product),
    onDelete: () => promptDelete(product),
    onClose: closeModal,
  }
}

export type ProductDetailApi = NonNullable<ReturnType<typeof useProductDetail>>
