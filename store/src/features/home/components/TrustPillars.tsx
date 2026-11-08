import { TRUST_PILLARS } from '../config/trustPillars.config'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/home/components/TrustPillars.tsx'

export const TrustPillars = () => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    {...uiMeta({ id: 'home.trust', component: 'TrustPillars', source: SOURCE })}
  >
    {TRUST_PILLARS.map((pillar, index) => (
      <div
        key={pillar.title}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3"
        {...uiMeta({
          id: `home.trust.item.${index}`,
          component: 'TrustPillars',
          source: SOURCE,
        })}
      >
        <div
          className={`w-12 h-12 rounded-xl ${pillar.bg} dark:bg-brand-950/60 ${pillar.accent} flex items-center justify-center text-xl flex-shrink-0`}
        >
          <i className={pillar.icon} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{pillar.title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{pillar.description}</p>
        </div>
      </div>
    ))}
  </div>
)
