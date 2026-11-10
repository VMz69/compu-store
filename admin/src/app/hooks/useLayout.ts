import { useLocation } from 'react-router-dom'
import { useAccessActions, useSession } from '@/features/access'
import { LOGOS, STORE_FRONT_URL } from '@/shared/config/store.config'
import { NAV_ITEMS } from '../nav.config'
import { askConfirm } from '@/shared/store/confirm.store'
import { useLayoutStore } from '@/shared/store/layout.store'

/** Estado del sidebar colapsable + perfil de sesión. */
export function useSidebar() {
  const isOpen = useLayoutStore((s) => s.isSidebarOpen)
  const { user, role } = useSession()
  const { logout } = useAccessActions()

  /** Cerrar sesión pide confirmación (evita salir por un clic accidental). */
  const requestLogout = () =>
    askConfirm({
      title: 'Cerrar sesión',
      message: user ? `¿Salir de la cuenta de ${user.name}? Los cambios ya guardados se conservan.` : '¿Cerrar la sesión actual?',
      confirmText: 'Cerrar sesión',
      onConfirm: logout,
    })

  return { isOpen, user, role, logout: requestLogout, storeUrl: STORE_FRONT_URL, logos: LOGOS }
}

/** Datos del topbar: título de la vista activa y control del sidebar. */
export function useTopbar() {
  const { pathname } = useLocation()
  const { role } = useSession()
  const isSidebarOpen = useLayoutStore((s) => s.isSidebarOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)

  const view = pathname.split('/')[1] || 'tablero'

  return {
    title: view,
    role,
    isSidebarOpen,
    toggleSidebar,
    /** Accesos directos de la barra superior (vistas fuera del sidebar) que el usuario puede ver. */
    shortcuts: NAV_ITEMS.filter((item) => item.placement === 'topbar' && role?.allowedViews.includes(item.id)).map((item) => ({
      ...item,
      to: `/${item.id}`,
      isActive: view === item.id,
    })),
  }
}
