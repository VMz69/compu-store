import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsHubCard } from '../components/SettingsHubCard'
import { useSettingsHub } from '../hooks/useSettingsHub'

const t = tracer('SettingsPage', 'src/features/settings/pages/SettingsPage.tsx')

/** Hub de Ajustes: indizador de sub-vistas. */
export function SettingsPage() {
  const cards = useSettingsHub()

  return (
    <PageContainer {...t('settings')}>
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand/10 text-brand uppercase tracking-wider">
            Centro de Control
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <i className="fa-solid fa-circle-check text-[9px]" aria-hidden="true" /> Sucursal Cojutepeque Activa
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Ajustes & Configuración del Sistema</h3>
        <p className="text-xs text-slate-400">
          Gobernanza corporativa, canales de captación, ciclo de pedidos y parámetros fiscales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl" {...t('settings.hub')}>
        {cards.map(({ card, stats }) => (
          <SettingsHubCard key={card.id} card={card} stats={stats} />
        ))}
      </div>
    </PageContainer>
  )
}
