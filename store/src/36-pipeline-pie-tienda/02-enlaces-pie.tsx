import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '@/35-pipeline-navegacion-tienda/00-director-navegacion-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/36-pipeline-pie-tienda/02-enlaces-pie.tsx'

export const FooterLinks = () => (
  <div
    {...uiMeta({ id: 'layout.footer.links', component: 'FooterLinks', source: SOURCE })}
  >
    <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase border-b border-slate-700/60 pb-2">
      Navegación
    </h3>
    <ul className="space-y-2 text-xs">
      {FOOTER_LINKS.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="hover:text-brand-accent transition-colors"
            {...uiMeta({
              id: `layout.footer.link.${link.to}`,
              component: 'FooterLinks',
              source: SOURCE,
            })}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)
