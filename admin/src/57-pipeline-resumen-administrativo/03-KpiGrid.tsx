import { KpiCard, type KpiData } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'

const t = tracer('KpiGrid', 'src/57-pipeline-resumen-administrativo/03-KpiGrid.tsx')

export function KpiGrid({ items }: { items: Array<KpiData & { id: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" {...t('dashboard.kpis')}>
      {items.map(({ id, ...kpi }) => (
        <KpiCard key={id} {...kpi} {...t(`dashboard.kpi.${id}`)} />
      ))}
    </div>
  )
}
