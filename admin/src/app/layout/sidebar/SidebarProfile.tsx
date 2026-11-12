import { UserAvatar, type Role, type User } from '@/00-director-acceso'
import { cn } from '@/shared/lib/cn'
import { tracer } from '@/00-trazabilidad'

const t = tracer('SidebarProfile', 'src/app/layout/sidebar/SidebarProfile.tsx')

interface SidebarProfileProps {
  isOpen: boolean
  user: User
  role: Role
  onLogout: () => void
}

const LOGOUT =
  'flex items-center gap-2.5 h-9 rounded-xl text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-colors'

/**
 * Perfil del colaborador activo + botón explícito "Cerrar sesión" (con confirmación).
 * El avatar es solo identidad: no ejecuta acciones.
 */
export function SidebarProfile({ isOpen, user, role, onLogout }: SidebarProfileProps) {
  return (
    <div className="px-3 pt-3 border-t border-white/10 shrink-0 space-y-2" {...t('layout.sidebar.profile')}>
      <div
        className={cn('flex items-center gap-2.5 overflow-hidden', isOpen ? 'p-2 rounded-xl bg-white/5 border border-white/5' : 'justify-center')}
        title={isOpen ? undefined : `${user.name} · ${role.name}`}
      >
        <UserAvatar name={user.name} avatar={user.avatar} ring={false} />
        {isOpen && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <span className="text-[9px] font-bold text-brand uppercase tracking-wider truncate block">{role.name}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className={cn(LOGOUT, isOpen ? 'w-full px-3' : 'w-10 mx-auto justify-center')}
        {...t('layout.sidebar.logout')}
      >
        <i className="fa-solid fa-arrow-right-from-bracket text-[13px] shrink-0" aria-hidden="true" />
        {isOpen && <span>Cerrar sesión</span>}
      </button>
    </div>
  )
}
