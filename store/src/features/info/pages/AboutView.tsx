import { Logo } from '@/shared/ui/Logo'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { STORE_CONFIG } from '@/shared/config/store.config'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/info/pages/AboutView.tsx'

export const AboutView = () => (
  <div className="space-y-6 sm:space-y-12 max-w-5xl mx-auto">
    <Breadcrumbs
      items={[{ label: 'Inicio', to: '/' }, { label: 'Nosotros' }]}
      traceId="nosotros.breadcrumbs"
    />

    <div
      className="bg-gradient-to-r from-brand-navy via-brand to-brand-accent rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-white shadow-lg text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
      {...uiMeta({ id: 'nosotros.hero', component: 'AboutView', source: SOURCE })}
    >
      <div className="space-y-3 max-w-2xl">
        <span className="inline-flex items-center rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/30">
          {STORE_CONFIG.city}, {STORE_CONFIG.country}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black">Sobre {STORE_CONFIG.name}</h1>
        <p className="text-sm sm:text-base text-blue-100 leading-relaxed">{STORE_CONFIG.about}</p>
      </div>
      <div className="flex w-20 h-20 sm:w-32 sm:h-32 shrink-0 items-center justify-center rounded-3xl bg-white p-4 shadow-lg ring-4 ring-white/20">
        <Logo isDark={false} variant="icon" className="max-h-full drop-shadow-sm" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-3"
        {...uiMeta({ id: 'nosotros.mision', component: 'AboutView', source: SOURCE })}
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand flex items-center justify-center text-2xl">
          <i className="fa-solid fa-bullseye" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Nuestra Misión</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {STORE_CONFIG.mission}
        </p>
      </div>

      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-3"
        {...uiMeta({ id: 'nosotros.vision', component: 'AboutView', source: SOURCE })}
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand flex items-center justify-center text-2xl">
          <i className="fa-solid fa-compass" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Nuestra Visión</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {STORE_CONFIG.vision}
        </p>
      </div>
    </div>

    <div
      className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none"
      {...uiMeta({ id: 'nosotros.valores', component: 'AboutView', source: SOURCE })}
    >
      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 text-center">
        Nuestros Valores Fundamentales
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {STORE_CONFIG.values.map((value, index) => (
          <div
            key={value}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center space-y-2"
            {...uiMeta({
              id: `nosotros.valores.item.${index}`,
              component: 'AboutView',
              source: SOURCE,
            })}
          >
            <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand-950/60 text-brand mx-auto flex items-center justify-center text-lg">
              <i className="fa-solid fa-check" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{value}</h4>
          </div>
        ))}
      </div>
    </div>
  </div>
)
