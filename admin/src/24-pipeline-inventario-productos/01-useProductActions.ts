import { ensurePermission, usePermission } from '@/00-director-acceso'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { closeModal, openModal } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { CATALOG_MODALS } from './05-modals'
import { useCatalogStore } from '../25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

/** Acciones sobre productos con validación de permisos (la vista solo oculta botones). */
export function useProductActions() {
  const toggleActive = useCatalogStore((s) => s.toggleActive)
  const adjust = useCatalogStore((s) => s.adjustStock)
  const remove = useCatalogStore((s) => s.deleteProduct)

  const permissions = {
    canCreate: usePermission('canCreateProduct'),
    canEdit: usePermission('canEditProduct'),
    canDelete: usePermission('canDeleteProduct'),
    canUpdateStock: usePermission('canUpdateStock'),
    canToggle: usePermission('canToggleVisibility'),
  }

  const toggleVisibility = (id: string) => {
    if (!ensurePermission('canToggleVisibility', 'No tienes permiso para cambiar visibilidad')) return
    const isActive = toggleActive(id)
    toast(`Producto ${isActive ? 'visible' : 'oculto'} en la tienda web`, 'info')
  }

  const adjustStock = (id: string, delta: number) => {
    if (!ensurePermission('canUpdateStock', 'No tienes permiso para actualizar inventario')) return
    adjust(id, delta)
    toast('Stock actualizado correctamente', 'success')
  }

  const promptDelete = (product: Product) =>
    askConfirm({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${product.name}" del inventario?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (!ensurePermission('canDeleteProduct', 'No tienes permiso para eliminar registros')) return
        remove(product.id)
        closeModal()
        toast('Producto eliminado permanentemente', 'info')
      },
    })

  return {
    permissions,
    toggleVisibility,
    adjustStock,
    promptDelete,
    openCreate: () => openModal(CATALOG_MODALS.productForm, null),
    openEdit: (product: Product) => openModal(CATALOG_MODALS.productForm, product),
    openDetail: (id: string) => openModal(CATALOG_MODALS.productDetail, id),
  }
}

export type ProductActions = ReturnType<typeof useProductActions>
