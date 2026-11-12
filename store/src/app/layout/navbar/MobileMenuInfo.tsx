import { Link } from 'react-router-dom'
import { MOBILE_SECTION_TITLE } from './navbar.styles'
import { STORE_CONFIG } from '@/shared/config/store.config'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/navbar/MobileMenuInfo.tsx'

const INFO_LINKS = [
  { to: '/about', label: 'Nosotros', icon: 'fa-solid fa-circle-info', traceId: 'layout.mobile-menu.about' },
  { to: '/contact', label: 'Contacto', icon: 'fa-solid fa-envelope', traceId: 'layout.mobile-menu.contact' },
]

const linkClass = (active: boolean) =>
  `flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
    active
      ? 'bg-brand-50 text-brand dark:bg-brand-950/60'
      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700'
  }`

const ICON_BOX = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'
const ICON_NEUTRAL = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'

interface MobileMenuInfoProps {
  pathname: string
  onNavigate: () => void
}

export const MobileMenuInfo = ({ pathname, onNavigate }: MobileMenuInfoProps) => (
  <section aria-labelledby="mobile-menu-info" className="space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
    <h2 id="mobile-menu-info" className={MOBILE_SECTION_TITLE}>Información</h2>
    <div className="space-y-1">
      {INFO_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          aria-current={pathname === link.to ? 'page' : undefined}
          className={linkClass(pathname === link.to)}
          {...uiMeta({ id: link.traceId, component: 'MobileMenuInfo', source: SOURCE })}
        >
          <span className={`${ICON_BOX} ${ICON_NEUTRAL}`}>
            <i className={link.icon} />
          </span>
          <span className="flex-1">{link.label}</span>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400" />
        </Link>
      ))}

      <a
        href={STORE_CONFIG.socials.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass(false)}
        {...uiMeta({ id: 'layout.mobile-menu.whatsapp', component: 'MobileMenuInfo', source: SOURCE })}
      >
        <span className={`${ICON_BOX} bg-whatsapp-light text-whatsapp-dark dark:bg-whatsapp-dark/30 dark:text-whatsapp`}>
          <i className="fa-brands fa-whatsapp text-base" />
        </span>
        <span className="flex-1">
          <span className="block">WhatsApp {STORE_CONFIG.phones[0]}</span>
          <span className="block text-[11px] font-medium text-slate-400">{STORE_CONFIG.scheduleShort}</span>
        </span>
        <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-400" />
      </a>
    </div>
  </section>
)
