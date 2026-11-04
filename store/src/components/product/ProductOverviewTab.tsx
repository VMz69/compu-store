import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/ProductOverviewTab.tsx'

const HIGHLIGHTS = [
  {
    icon: 'fa-solid fa-shield-heart',
    tone: 'bg-brand-50 text-brand',
    title: 'Garantía Escrita',
    description:
      'Respaldo de 6 a 12 meses directamente en nuestra sala de ventas en Cojutepeque.',
  },
  {
    icon: 'fa-solid fa-microchip',
    tone: 'bg-emerald-50 text-emerald-600',
    title: 'Hardware Testeado',
    description:
      'Equipos sometidos a rigurosas pruebas de temperatura y estrés por nuestros técnicos.',
  },
  {
    icon: 'fa-solid fa-bolt-lightning',
    tone: 'bg-amber-50 text-amber-600',
    title: 'Entrega Inmediata',
    description:
      'Retira el mismo día en tienda o solicita envío seguro a cualquier punto del país.',
  },
  {
    icon: 'fa-solid fa-comments',
    tone: 'bg-blue-50 text-brand',
    title: 'Soporte Técnico',
    description:
      'Asesoría directa vía WhatsApp para resolver dudas de instalación y configuración.',
  },
]

export const ProductOverviewTab = ({ product }: { product: Product }) => (
  <div
    className="space-y-8 animate-fade-in"
    {...uiMeta({
      id: 'producto.tabs.overview',
      component: 'ProductOverviewTab',
      source: SOURCE,
    })}
  >
    <div className="max-w-3xl space-y-4">
      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
        Acerca de este artículo
      </h3>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
        {product.description}
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      {HIGHLIGHTS.map((highlight) => (
        <div
          key={highlight.title}
          className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
          {...uiMeta({
            id: `producto.tabs.overview.highlight.${highlight.title}`,
            component: 'ProductOverviewTab',
            source: SOURCE,
          })}
        >
          <div
            className={`w-10 h-10 rounded-xl ${highlight.tone} flex items-center justify-center text-lg mb-3`}
          >
            <i className={highlight.icon} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
              {highlight.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              {highlight.description}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-blue-50/50 dark:bg-brand-950/30 rounded-2xl p-6 border border-blue-100 dark:border-brand-900 space-y-3">
      <h4 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-box-open" />
        <span>¿Qué incluye el empaque?</span>
      </h4>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
        <li className="flex items-center gap-2">
          <i className="fa-solid fa-check text-emerald-500" />
          <span>1x {product.name}</span>
        </li>
        <li className="flex items-center gap-2">
          <i className="fa-solid fa-check text-emerald-500" />
          <span>1x Cable / Adaptador de corriente original homologado</span>
        </li>
        <li className="flex items-center gap-2">
          <i className="fa-solid fa-check text-emerald-500" />
          <span>1x Factura y certificado de garantía sellado por CompuStore SV</span>
        </li>
      </ul>
    </div>
  </div>
)
