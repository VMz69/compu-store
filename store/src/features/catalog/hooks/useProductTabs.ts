import { useEffect } from 'react'
import { useUIStore } from '@/shared/store/ui.store'
import type { ProductDetailTab } from '@/shared/store/ui.store'

/**
 * Pestaña activa del detalle de producto. Vuelve a «Descripción General» al
 * cambiar de producto, para que no se arrastre la pestaña del producto anterior.
 */
export const useProductTabs = (productId?: string) => {
  const activeTab = useUIStore((state) => state.productDetailTab)
  const setActiveTab = useUIStore((state) => state.setProductDetailTab)

  useEffect(() => {
    setActiveTab('overview')
  }, [productId, setActiveTab])

  const selectTab = (tab: ProductDetailTab) => setActiveTab(tab)

  return { activeTab, selectTab }
}
