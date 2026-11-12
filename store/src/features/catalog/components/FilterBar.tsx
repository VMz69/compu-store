import { Select } from '@/shared/ui/Select'
import { SORT_OPTIONS } from '../config/sort.config'
import { uiMeta } from '@/04-trazabilidad-ui'

import type { SortBy } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/FilterBar.tsx'
const SOURCE_SELECT = 'src/shared/ui/Select.tsx'

interface FilterBarProps {
  count: number
  subject: string
  sortBy: SortBy
  onSortChange: (value: SortBy) => void
  traceId: string
}

export const FilterBar = ({
  count,
  subject,
  sortBy,
  onSortChange,
  traceId,
}: FilterBarProps) => (
  <div
    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800"
    {...uiMeta({ id: traceId, component: 'FilterBar', source: SOURCE })}
  >
    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
      Mostrando <b>{count}</b> {subject}
    </span>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <label
        htmlFor={`${traceId}-sort`}
        className="text-xs font-bold text-slate-500 whitespace-nowrap"
      >
        Ordenar:
      </label>
      <Select
        id={`${traceId}-sort`}
        options={SORT_OPTIONS}
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as SortBy)}
        className="w-full sm:w-52"
        {...uiMeta({
          id: `${traceId}.sort`,
          component: 'FilterBar',
          source: SOURCE_SELECT,
        })}
      />
    </div>
  </div>
)
