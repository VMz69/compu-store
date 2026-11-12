import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useSidebar } from '../02-pipeline-marco-administrativo/02-useLayout'
import { useNavItems } from './04-useNavItems'
import { SidebarNavItem } from './02-SidebarNavItem'
import { SidebarProfile } from './03-SidebarProfile'

const t = tracer('Sidebar', 'src/03-pipeline-navegacion-administrativa/01-Sidebar.tsx')

/** Sidebar compacto/expandible con identidad, navegación por rol y perfil. */
export function Sidebar() {
  const { isOpen, user, role, logout, storeUrl, logos } = useSidebar()
  // Las vistas con acceso directo en la barra superior (Ajustes) no se listan aquí.
  const items = useNavItems().filter((i) => i.placement === 'main')

  return (
    <aside
      className={cn(
        'sidebar-transition bg-sidebar rounded-2xl flex flex-col relative z-20 shadow-xl shrink-0 overflow-hidden py-4 border border-white/5',
        isOpen ? 'w-[230px]' : 'w-[74px]',
      )}
      {...t('layout.sidebar')}
    >
      <div className="flex items-center justify-center mb-6 h-11 px-3 shrink-0 overflow-hidden">
        {isOpen ? (
          <SafeImage
            src={logos.onDarkCropped}
            fallback={logos.onDark}
            alt="CompuStore SV"
            className="h-9 max-w-[185px] w-auto object-contain mx-auto drop-shadow-sm transition-all"
          />
        ) : (
          <SafeImage
            src={logos.iconOnDark}
            fallback={logos.icon}
            alt="CompuStore SV"
            className="h-8 w-8 object-contain drop-shadow-sm transition-transform hover:scale-105"
          />
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 px-3 overflow-y-auto hide-scrollbar" aria-label="Navegación principal" {...t('layout.sidebar.nav')}>
        {items.map((item) => (
          <SidebarNavItem key={item.id} item={item} isOpen={isOpen} />
        ))}
      </nav>

      <div className="px-3 my-2 shrink-0">
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          title="Abrir Tienda Web"
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-brand/20 border border-white/5 text-slate-300 hover:text-white transition-all text-xs font-bold',
            !isOpen && 'justify-center w-full',
          )}
          {...t('layout.sidebar.store-link')}
        >
          <i className="fa-solid fa-arrow-up-right-from-square text-brand text-xs shrink-0" aria-hidden="true" />
          <span className={cn('nav-text-transition whitespace-nowrap', isOpen ? 'opacity-100' : 'sr-only')}>
            Tienda Web
          </span>
        </a>
      </div>

      {user && role && <SidebarProfile isOpen={isOpen} user={user} role={role} onLogout={logout} />}
    </aside>
  )
}
