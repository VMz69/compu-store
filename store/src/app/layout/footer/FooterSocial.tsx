import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/footer/FooterSocial.tsx'

const SOCIALS = [
  { label: 'Facebook', icon: 'fa-brands fa-facebook-f', href: STORE_CONFIG.socials.facebook },
  { label: 'Instagram', icon: 'fa-brands fa-instagram', href: STORE_CONFIG.socials.instagram },
  { label: 'TikTok', icon: 'fa-brands fa-tiktok', href: STORE_CONFIG.socials.tiktok },
  { label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', href: STORE_CONFIG.socials.whatsapp },
]

export const FooterSocial = () => (
  <div {...uiMeta({ id: 'layout.footer.social', component: 'FooterSocial', source: SOURCE })}>
    <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase border-b border-slate-700/60 pb-2">
      Redes y Pagos
    </h3>
    <div className="flex space-x-3 mb-6">
      {SOCIALS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-brand hover:text-white transition-all text-sm"
          {...uiMeta({
            id: `layout.footer.social.${social.label.toLowerCase()}`,
            component: 'FooterSocial',
            source: SOURCE,
          })}
        >
          <i className={social.icon} />
        </a>
      ))}
    </div>
    <div className="pt-2">
      <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase">
        Medios de Pago Aceptados
      </span>
      <div className="flex items-center gap-3 text-slate-400 text-2xl">
        <i className="fa-brands fa-cc-visa" title="Visa" />
        <i className="fa-brands fa-cc-mastercard" title="Mastercard" />
        <i className="fa-solid fa-money-bill-wave" title="Efectivo en Sala" />
        <i className="fa-solid fa-qrcode" title="Transferencia / Chivo" />
      </div>
    </div>
  </div>
)
