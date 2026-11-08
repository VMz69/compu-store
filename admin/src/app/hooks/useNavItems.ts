import { useLocation } from 'react-router-dom'
import { useSession } from '@/features/access'
import { useInvoiceableCount, usePendingOrdersCount } from '@/features/sales'
import { NAV_ITEMS, type NavBadgeKey } from '../nav.config'

/** Ítems del sidebar permitidos para el rol, con estado activo y contadores. */
export function useNavItems() {
  const { role } = useSession()
  const { pathname } = useLocation()
  const badges: Record<NavBadgeKey, number> = {
    orders: usePendingOrdersCount(),
    toInvoice: useInvoiceableCount(),
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
