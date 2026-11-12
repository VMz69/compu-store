import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { useProductFiltersStore } from '../../filters.store'
import { brandDeleteBlock, matchesText, productsOfBrand } from '../../lib/taxonomy'
import { CATALOG_MODALS } from '../../modals'
import { useCatalogStore } from '../../store'
import type { Brand } from '../../types'

/** Pestaña Marcas: tabla con uso, activación y acciones con reglas de negocio. */
export function useBrandsTab(search: string) {
  const navigate = useNavigate()
  const brands = useCatalogStore((s) => s.brands)
  const products = useCatalogStore((s) => s.products)
  const deleteBrand = useCatalogStore((s) => s.deleteBrand)
  const toggleBrand = useCatalogStore((s) => s.toggleBrand)
  const filters = useProductFiltersStore()
  const canEdit = usePermission('canManageTaxonomy')
  const canDelete = usePermission('canManageTaxonomy')

  const items = useMemo(
    () =>
      [...brands]
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .filter((b) => matchesText([b.name, b.slug, b.website, b.description], search))
        .map((brand) => {
          const count = productsOfBrand(products, brand.name).length
          return { brand, productCount: count, deleteBlock: brandDeleteBlock(count) }
        }),
    [brands, products, search],
  )

  const remove = (brand: Brand, block: string | null) => {
    if (block) return toast(`No se puede eliminar "${brand.name}". ${block}`, 'warning')
    askConfirm({
      title: `Eliminar marca ${brand.name}`,
      message: 'La marca no tiene productos asociados y dejará de ofrecerse en el formulario de productos.',
      confirmText: 'Eliminar marca',
      onConfirm: () => {
        if (!ensurePermission('canManageTaxonomy', 'No tienes permiso para eliminar marcas')) return
        try {
          deleteBrand(brand.id)
          toast(`Marca "${brand.name}" eliminada`, 'info')
        } catch (error) {
          toast(error instanceof Error ? error.message : 'No se pudo eliminar la marca.', 'danger')
        }
      },
    })
  }

  return {
    items,
    total: brands.length,
    canEdit,
    canDelete,
    edit: (brand: Brand) => openModal(CATALOG_MODALS.brandForm, brand),
    remove,
    toggle: (brand: Brand) => {
      if (!ensurePermission('canManageTaxonomy', 'No tienes permiso para modificar marcas')) return
      const active = toggleBrand(brand.id)
      toast(active ? `Marca "${brand.name}" activada` : `Marca "${brand.name}" desactivada: ya no se ofrece en productos nuevos`, 'info')
    },
    /** Lleva a Productos buscando por la marca (todas las categorías y estados). */
    showProducts: (brand: Brand) => {
      filters.setCategory('all')
      filters.setStockFilter('all')
      filters.setSearch(brand.name)
      navigate('/productos')
    },
  }
}

export type BrandsTabApi = ReturnType<typeof useBrandsTab>
