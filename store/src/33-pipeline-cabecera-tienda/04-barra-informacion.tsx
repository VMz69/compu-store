import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/33-pipeline-cabecera-tienda/04-barra-informacion.tsx'

export const TopBar = () => (
  <div
    className="hidden lg:block bg-brand-navy dark:bg-brand-midnight text-slate-300 text-xs py-2 border-b border-brand-midnight dark:border-slate-800 transition-colors"
    {...uiMeta({ id: 'layout.topbar', component: 'TopBar', source: SOURCE })}
  >
    <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-center sm:text-left">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand/30 text-sky-200 border border-brand/50">
          <i className="fa-solid fa-store mr-1 text-[9px]" /> UBICACIÓN
        </span>
        <span>
          {STORE_CONFIG.city}: {STORE_CONFIG.addressShort}
        </span>
      </div>
      <div className="flex items-center gap-4 text-slate-300">
        <a
          href={STORE_CONFIG.socials.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-whatsapp transition-colors flex items-center gap-1 font-medium"
          {...uiMeta({
            id: 'layout.topbar.whatsapp',
            component: 'TopBar',
            source: SOURCE,
          })}
        >
          <i className="fa-brands fa-whatsapp text-whatsapp text-sm" /> WhatsApp:{' '}
          {STORE_CONFIG.phones[0]}
        </a>
        <span className="text-slate-600 hidden md:inline">|</span>
        <span className="hidden md:inline">
          <i className="fa-regular fa-clock mr-1 text-slate-400" />
          {STORE_CONFIG.scheduleShort}
        </span>
      </div>
    </div>
  </div>
)
