import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccessActions, useSession } from '@/00-director-acceso'
import { LOGOS, STORE_FRONT_URL } from '@/85-pipeline-identificadores-texto/03-store.config'
import { NAV_ITEMS } from '../nav.config'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { useLayoutStore } from '@/75-pipeline-estado-navegacion/03-layout.store'
import { usePageMetaStore } from '@/75-pipeline-estado-navegacion/02-pageMeta.store'

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

/**
 * Datos del topbar. El título es ÚNICO en toda la vista: el que declare la sub-vista
 * (`usePageMeta`) o, si no declara nada, el nombre de la vista en el menú.
 * También actualiza el título de la pestaña del navegador.
 */
export function useTopbar() {
  const { pathname } = useLocation()
  const { role } = useSession()
  const isSidebarOpen = useLayoutStore((s) => s.isSidebarOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const meta = usePageMetaStore((s) => s.meta)

  const view = pathname.split('/')[1] || 'tablero'
  const title = meta?.title ?? NAV_ITEMS.find((item) => item.id === view)?.label ?? 'Panel'

  useEffect(() => {
    document.title = `${title} · CompuStore SV Admin`
  }, [title])

  return {
    title,
    crumbs: meta?.crumbs ?? [],
    backTo: meta?.backTo ?? null,
    badge: meta?.badge ?? null,
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
