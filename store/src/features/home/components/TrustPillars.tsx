import { TRUST_PILLARS } from '../config/trustPillars.config'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/home/components/TrustPillars.tsx'

export const TrustPillars = () => (
  <div
    className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
    {...uiMeta({ id: 'home.trust', component: 'TrustPillars', source: SOURCE })}
  >
    {TRUST_PILLARS.map((pillar, index) => (
      <div
        key={pillar.title}
        className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"
        {...uiMeta({
          id: `home.trust.item.${index}`,
          component: 'TrustPillars',
          source: SOURCE,
        })}
      >
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${pillar.bg} dark:bg-brand-950/60 ${pillar.accent} flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}
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
