import { useState } from 'react'
import { useImageViewer } from '@/81-pipeline-visualizacion-imagenes/02-useImageViewer'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { getPricing, getStockSeverity } from '../25-pipeline-persistencia-catalogo/02-catalog.service'
import { displayImages } from '../17-pipeline-ficha-producto/03-productImages'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'
import { useProductActions } from '../24-pipeline-inventario-productos/00-director-inventario-productos'

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
