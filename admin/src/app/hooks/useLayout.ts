import { useLocation } from 'react-router-dom'
import { useAccessActions, useSession } from '@/features/access'
import { LOGOS, STORE_FRONT_URL } from '@/shared/config/store.config'
import { useLayoutStore } from '@/shared/store/layout.store'

/** Estado del sidebar colapsable + perfil de sesión. */
export function useSidebar() {
  const isOpen = useLayoutStore((s) => s.isSidebarOpen)
  const { user, role } = useSession()
  const { logout } = useAccessActions()

  return { isOpen, user, role, logout, storeUrl: STORE_FRONT_URL, logos: LOGOS }
}

/** Datos del topbar: título de la vista activa y control del sidebar. */
export function useTopbar() {
  const { pathname } = useLocation()
  const { role } = useSession()
  const isSidebarOpen = useLayoutStore((s) => s.isSidebarOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)

  return {
    title: pathname.split('/')[1] || 'tablero',
    role,
    isSidebarOpen,
    toggleSidebar,
  }
}
