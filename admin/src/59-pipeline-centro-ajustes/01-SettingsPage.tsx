import { PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { SettingsHubCard } from './05-SettingsHubCard'
import { useSettingsHub } from './02-useSettingsHub'

const t = tracer('SettingsPage', 'src/features/settings/pages/SettingsPage.tsx')

/** Hub de Ajustes: indizador de sub-vistas. */
export function SettingsPage() {
  const cards = useSettingsHub()

  return (
    <PageContainer {...t('settings')}>
      {/* Ancho completo: 1 col (móvil) · 2 (md) · 3 en xl (ver spanClass en hub.config). */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" {...t('settings.hub')}>
        {cards.map(({ card, stats }) => (
          <SettingsHubCard key={card.id} card={card} stats={stats} />
        ))}
      </div>
    </PageContainer>
  )
}
