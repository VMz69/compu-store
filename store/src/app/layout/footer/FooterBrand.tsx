import { Link } from 'react-router-dom'
import { Logo } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/footer/FooterBrand.tsx'

export const FooterBrand = () => (
  <div
    className="col-span-2 md:col-span-1 space-y-4"
    {...uiMeta({ id: 'layout.footer.brand', component: 'FooterBrand', source: SOURCE })}
  >
    <Link
      to="/"
      className="inline-block cursor-pointer"
      {...uiMeta({
        id: 'layout.footer.logo',
        component: 'FooterBrand',
        source: SOURCE,
      })}
    >
      <Logo isDark className="h-9 sm:h-10" />
    </Link>
    <p className="text-xs leading-relaxed text-slate-300">{STORE_CONFIG.about}</p>
    <div className="text-xs text-slate-400 pt-1">
      <p className="font-bold text-slate-200">Horario de Atención:</p>
      <p>{STORE_CONFIG.schedule}</p>
    </div>
  </div>
)
