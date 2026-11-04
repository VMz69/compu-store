import { Link } from 'react-router-dom'
import { ContactForm } from '@/components/contact/ContactForm'
import { ContactInfoCards } from '@/components/contact/ContactInfoCards'
import { ContactMap } from '@/components/contact/ContactMap'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { STORE_CONFIG } from '@/data/storeConfig'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/pages/ContactView.tsx'

const quickActions = [
  {
    id: 'contacto.quick.whatsapp',
    label: 'WhatsApp',
    value: STORE_CONFIG.phones[0],
    icon: 'fa-brands fa-whatsapp',
    tone: 'bg-whatsapp hover:bg-whatsapp-hover text-white',
    href: STORE_CONFIG.socials.whatsapp,
  },
  {
    id: 'contacto.quick.phone',
    label: 'Llamar',
    value: STORE_CONFIG.phones[1],
    icon: 'fa-solid fa-phone',
    tone: 'bg-brand hover:bg-brand-hover text-white',
    href: `tel:+503${STORE_CONFIG.phones[1].replace(/\D/g, '')}`,
  },
  {
    id: 'contacto.quick.email',
    label: 'Correo',
    value: STORE_CONFIG.email,
    icon: 'fa-regular fa-envelope',
    tone: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
    href: `mailto:${STORE_CONFIG.email}`,
  },
]

export const ContactView = () => (
  <div className="mx-auto max-w-5xl space-y-8">
    <Breadcrumbs
      items={[{ label: 'Inicio', to: '/' }, { label: 'Contacto' }]}
      traceId="contacto.breadcrumbs"
    />

    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      {...uiMeta({ id: 'contacto.header', component: 'ContactView', source: SOURCE })}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
          Contáctanos
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Estamos para asesorarte en compras, compatibilidad y cotizaciones
        </p>
      </div>
      <Link
        to="/"
        className="hidden text-xs font-bold text-brand hover:underline sm:inline-flex"
        {...uiMeta({ id: 'contacto.header.volver', component: 'ContactView', source: SOURCE })}
      >
        <i className="fa-solid fa-arrow-left mr-1.5 text-[10px]" /> Volver al inicio
      </Link>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {quickActions.map((action) => (
        <a
          key={action.id}
          href={action.href}
          target={action.href.startsWith('http') ? '_blank' : undefined}
          rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`flex items-center gap-3 rounded-2xl p-4 text-white shadow-sm transition-all active:scale-[0.98] ${action.tone}`}
          {...uiMeta({ id: action.id, component: 'ContactView', source: SOURCE })}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <i className={`${action.icon} text-lg`} />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
              {action.label}
            </span>
            <span className="block truncate text-xs font-semibold">{action.value}</span>
          </span>
        </a>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <ContactForm />
      <ContactInfoCards />
    </div>

    <ContactMap />
  </div>
)
