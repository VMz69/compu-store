import { buildAssistantUrl } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/app/layout/FloatingWhatsApp.tsx'

interface FloatingWhatsAppProps {
  /** Con la barra de compra móvil activa, se oculta bajo `lg` para no duplicar el CTA. */
  hiddenOnMobile?: boolean
}

export const FloatingWhatsApp = ({ hiddenOnMobile = false }: FloatingWhatsAppProps) => (
  <div
    className={`fixed bottom-6 right-6 z-20 items-center gap-3 ${hiddenOnMobile ? 'hidden lg:flex' : 'flex'}`}
    {...uiMeta({
      id: 'layout.floating-whatsapp',
      component: 'FloatingWhatsApp',
      source: SOURCE,
    })}
  >
    <div className="hidden xl:flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3.5 py-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-xs font-semibold floating-hint pointer-events-none">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>¿Dudas con tu compra? Chatea con un asesor</span>
    </div>
    <a
      href={buildAssistantUrl()}
      target="_blank"
      rel="noopener noreferrer"
      title="Asistencia directa por WhatsApp"
      className="w-14 h-14 rounded-full bg-whatsapp hover:bg-whatsapp-hover text-white shadow-floating flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative focus:outline-none"
      {...uiMeta({
        id: 'layout.floating-whatsapp.button',
        component: 'FloatingWhatsApp',
        source: SOURCE,
      })}
    >
      <i className="fa-brands fa-whatsapp text-3xl" />
      <span aria-hidden="true" className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
      <span aria-hidden="true" className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
    </a>
  </div>
)
