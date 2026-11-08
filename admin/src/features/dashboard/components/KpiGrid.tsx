import { KpiCard, type KpiData } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('KpiGrid', 'src/features/dashboard/components/KpiGrid.tsx')

export function KpiGrid({ items }: { items: Array<KpiData & { id: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" {...t('dashboard.kpis')}>
      {items.map(({ id, ...kpi }) => (
        <KpiCard key={id} {...kpi} {...t(`dashboard.kpi.${id}`)} />
      ))}
    </div>
  )
}
