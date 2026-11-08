import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { tracer } from '@/ui-traceability'
import type { NavItem } from '../../hooks/useNavItems'

const t = tracer('SidebarNavItem', 'src/app/layout/sidebar/SidebarNavItem.tsx')

export function SidebarNavItem({ item, isOpen }: { item: NavItem; isOpen: boolean }) {
  return (
    <Link
      to={item.to}
      title={item.label}
      aria-current={item.isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center h-10 rounded-xl transition-all group overflow-hidden shrink-0',
        item.isActive
          ? 'bg-brand text-white shadow-brand-glow font-bold'
          : 'text-sidebar-muted hover:bg-white/5 hover:text-white',
        isOpen ? 'px-3 justify-between' : 'justify-center w-full',
      )}
      {...t(`layout.sidebar.nav.${item.id}`)}
    >
      <div className="flex items-center gap-3">
        <i
          className={cn(
            item.icon,
            'text-base w-5 text-center',
            !item.isActive && 'group-hover:scale-110 transition-transform',
          )}
          aria-hidden="true"
        />
        <span className={cn('text-xs nav-text-transition whitespace-nowrap', isOpen ? 'opacity-100' : 'sr-only')}>
          {item.label}
        </span>
      </div>
      {item.badgeCount > 0 && isOpen && (
        <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow-sm shrink-0">
          {item.badgeCount}
        </span>
      )}
      {item.badgeCount > 0 && !isOpen && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-sm shrink-0" aria-hidden="true" />
      )}
    </Link>
  )
}
