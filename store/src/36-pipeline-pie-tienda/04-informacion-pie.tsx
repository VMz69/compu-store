import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/footer/FooterStoreInfo.tsx'

export const FooterStoreInfo = () => (
  <div
    className="col-span-2 md:col-span-1"
    {...uiMeta({
      id: 'layout.footer.store',
      component: 'FooterStoreInfo',
      source: SOURCE,
    })}
  >
    <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase border-b border-slate-700/60 pb-2">
      Sala de Ventas
    </h3>
    <ul className="space-y-3 text-xs">
      <li className="flex items-start gap-2.5">
        <i className="fa-solid fa-location-dot mt-0.5 text-brand-accent text-sm" />
        <span>{STORE_CONFIG.address}</span>
      </li>
      <li className="flex items-center gap-2.5">
        <i className="fa-solid fa-phone text-brand-accent text-sm" />
        <span className="font-semibold text-white">{STORE_CONFIG.phones.join(' | ')}</span>
      </li>
      <li className="flex items-center gap-2.5">
        <i className="fa-brands fa-whatsapp text-whatsapp text-sm" />
        <a
          href={STORE_CONFIG.socials.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-whatsapp transition-colors"
          {...uiMeta({
            id: 'layout.footer.whatsapp',
            component: 'FooterStoreInfo',
            source: SOURCE,
          })}
        >
          WhatsApp: {STORE_CONFIG.phones[0]}
        </a>
      </li>
    </ul>
  </div>
)
