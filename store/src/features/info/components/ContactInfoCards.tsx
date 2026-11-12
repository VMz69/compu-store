import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/info/components/ContactInfoCards.tsx'

export const ContactInfoCards = () => (
  <div
    className="lg:col-span-5 space-y-4"
    {...uiMeta({
      id: 'contacto.info',
      component: 'ContactInfoCards',
      source: SOURCE,
    })}
  >
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-3">
      <div className="flex items-center gap-3 text-brand">
        <i className="fa-solid fa-location-dot text-xl" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Sala de Ventas Física
        </h4>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {STORE_CONFIG.address}
      </p>
      <span className="inline-block text-[11px] font-bold text-brand bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-full">
        Frente a Dollar City • 2da Planta
      </span>
    </div>

    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-3">
      <div className="flex items-center gap-3 text-emerald-600">
        <i className="fa-brands fa-whatsapp text-2xl" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Atención Directa
        </h4>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        Escríbenos o llámanos para verificar disponibilidad de piezas antes de visitarnos.
      </p>
      <div className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
        <p>WhatsApp: {STORE_CONFIG.phones[0]}</p>
        <p>Teléfono: {STORE_CONFIG.phones[1]}</p>
        <p className="text-slate-500 dark:text-slate-400 font-normal">
          {STORE_CONFIG.schedule}
        </p>
      </div>
      <a
        href={STORE_CONFIG.socials.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mt-2 bg-whatsapp hover:bg-whatsapp-hover text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
        {...uiMeta({
          id: 'contacto.info.whatsapp',
          component: 'ContactInfoCards',
          source: SOURCE,
        })}
      >
        <i className="fa-brands fa-whatsapp text-base" />
        Abrir WhatsApp
      </a>
    </div>
  </div>
)
