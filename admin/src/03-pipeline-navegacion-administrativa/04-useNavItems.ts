import { useLocation } from 'react-router-dom'
import { useSession } from '@/00-director-acceso'
import { usePendingReviewsCount } from '@/00-director-interacciones'
import { useInvoiceableCount, usePendingOrdersCount } from '@/00-director-ventas'
import { NAV_ITEMS, type NavBadgeKey } from './05-nav.config'

/** Ítems del sidebar permitidos para el rol, con estado activo y contadores. */
export function useNavItems() {
  const { role } = useSession()
  const { pathname } = useLocation()
  const badges: Record<NavBadgeKey, number> = {
    orders: usePendingOrdersCount(),
    toInvoice: useInvoiceableCount(),
    reviews: usePendingReviewsCount(),
  }
  const currentView = pathname.split('/')[1]

  return NAV_ITEMS.filter((item) => role?.allowedViews.includes(item.id)).map((item) => ({
    ...item,
    to: `/${item.id}`,
    isActive: currentView === item.id,
    badgeCount: item.badge ? badges[item.badge] : 0,
  }))
}

export type NavItem = ReturnType<typeof useNavItems>[number]
