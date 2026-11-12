import { Link } from 'react-router-dom'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/shared/ui/Breadcrumbs.tsx'

export interface Crumb {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: Crumb[]
  traceId: string
}

export const Breadcrumbs = ({ items, traceId }: BreadcrumbsProps) => (
  <nav
    className="flex flex-wrap text-xs text-slate-500 dark:text-slate-400 gap-2 items-center"
    {...uiMeta({ id: traceId, component: 'Breadcrumbs', source: SOURCE })}
  >
    {items.map((item, index) => (
      <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
        {index > 0 ? (
          <i className="fa-solid fa-chevron-right text-[9px] text-slate-400" />
        ) : null}
        {item.to ? (
          <Link
            to={item.to}
            className="hover:text-brand transition-colors"
            {...uiMeta({
              id: `${traceId}.crumb.${index}`,
              component: 'Breadcrumbs',
              source: SOURCE,
            })}
          >
            {item.label}
          </Link>
        ) : (
          <span className="font-bold text-brand truncate max-w-[220px] sm:max-w-xs">
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
)
