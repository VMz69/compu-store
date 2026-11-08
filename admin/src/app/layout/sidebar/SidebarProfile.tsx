import { UserAvatar, type Role, type User } from '@/features/access'
import { tracer } from '@/ui-traceability'

const t = tracer('SidebarProfile', 'src/app/layout/sidebar/SidebarProfile.tsx')

interface SidebarProfileProps {
  isOpen: boolean
  user: User
  role: Role
  onLogout: () => void
}

/** Perfil del colaborador activo y cierre de sesión (variante expandida/colapsada). */
export function SidebarProfile({ isOpen, user, role, onLogout }: SidebarProfileProps) {
  return (
    <div className="px-3 pt-3 border-t border-white/10 shrink-0" {...t('layout.sidebar.profile')}>
      {isOpen ? (
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 overflow-hidden">
          <UserAvatar name={user.name} avatar={user.avatar} ring={false} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <span className="text-[9px] font-bold text-brand uppercase tracking-wider truncate block">{role.name}</span>
          </div>
          <button
            type="button"
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
            className="text-slate-400 hover:text-red-400 text-xs shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            onClick={onLogout}
            {...t('layout.sidebar.logout')}
          >
            <i className="fa-solid fa-power-off" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <button
            type="button"
            title={`Cerrar Sesión (${user.name})`}
            aria-label="Cerrar Sesión"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-all group relative"
            onClick={onLogout}
            {...t('layout.sidebar.logout')}
          >
            <span className="group-hover:opacity-30 transition-opacity">
              <UserAvatar name={user.name} avatar={user.avatar} ring={false} />
            </span>
            <i
              className="fa-solid fa-power-off text-red-400 text-xs absolute opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  )
}
