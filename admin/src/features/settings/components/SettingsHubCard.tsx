import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { tracer } from '@/ui-traceability'
import type { HubCardConfig } from '../config/hub.config'
import type { HubStat } from '../hooks/useSettingsHub'

const t = tracer('SettingsHubCard', 'src/features/settings/components/SettingsHubCard.tsx')

const STAT_COLUMNS: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3' }

const CTA_PRIMARY = 'bg-brand text-white hover:bg-brand-hover shadow-xs'
const CTA_SECONDARY =
  'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'

export function SettingsHubCard({ card, stats }: { card: HubCardConfig; stats: HubStat[] }) {
  return (
    <div
      className={cn(
        'h-full rounded-2xl p-5 shadow-sm hover:shadow-soft-card transition-all flex flex-col justify-between group',
        card.spanClass,
        card.featured
          ? 'bg-linear-to-br from-white via-white to-brand-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20 border-2 border-brand/30 dark:border-brand-800/60'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
      )}
      {...t(`settings.hub.${card.id}`)}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0', card.iconClass)}>
            <i className={card.icon} aria-hidden="true" />
          </div>
          <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border', card.badgeClass)}>
            {card.badge}
          </span>
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-brand transition-colors">
          {card.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{card.description}</p>

        <div
          className={cn(
            'grid gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center text-xs',
            STAT_COLUMNS[stats.length] ?? 'grid-cols-2',
          )}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">{stat.label}</span>
              <span className={cn('block truncate font-black', stat.valueClass ?? 'text-slate-800 dark:text-slate-100')}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to={card.to}
        className={cn(
          'mt-4 w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all',
          card.featured ? CTA_PRIMARY : CTA_SECONDARY,
        )}
        {...t(`settings.hub.${card.id}.open`)}
      >
        <span>{card.cta}</span>
        <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
      </Link>
    </div>
  )
}
