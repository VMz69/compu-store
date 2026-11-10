import { DataTable, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { PipelineApi } from '../../hooks/usePipeline'
import { StatusCriteriaRow } from './StatusCriteriaRow'

const t = tracer('StatusCriteriaTable', 'src/features/sales/components/pipeline/StatusCriteriaTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Paso / Estado', className: 'px-4' },
  { label: 'Criterio y disparador' },
  { label: 'Efecto en inventario / facturación' },
  { label: 'Próximas Transiciones' },
  { label: 'Órdenes', className: 'px-3 text-center' },
  { label: 'Acción', className: 'px-4 text-right' },
]

type StatusCriteriaTableProps = Pick<PipelineApi, 'criteria' | 'showOrders' | 'openDetail'>

/** Tabla explicativa de criterios operativos por estado. */
export function StatusCriteriaTable({ criteria, showOrders, openDetail }: StatusCriteriaTableProps) {
  return (
    <DataTable headers={HEADERS} {...t('settings.criteria')}>
      {criteria.map(({ status, count, nextNames }) => (
        <StatusCriteriaRow
          key={status.id}
          status={status}
          count={count}
          nextNames={nextNames}
          onShowOrders={showOrders}
          onOpenDetail={openDetail}
        />
      ))}
    </DataTable>
  )
}
