import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/ui/QuantitySelector.tsx'

interface QuantitySelectorProps {
  value: number
  max: number
  onIncrement: () => void
  onDecrement: () => void
  traceId: string
}

export const QuantitySelector = ({
  value,
  max,
  onIncrement,
  onDecrement,
  traceId,
}: QuantitySelectorProps) => (
  <div
    className="flex shrink-0 items-center border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 h-12 px-2 justify-center"
    {...uiMeta({ id: traceId, component: 'QuantitySelector', source: SOURCE })}
  >
    <button
      type="button"
      onClick={onDecrement}
      disabled={value <= 1}
      aria-label="Disminuir cantidad"
      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-500 hover:text-brand disabled:opacity-30 cursor-pointer"
      {...uiMeta({
        id: `${traceId}.menos`,
        component: 'QuantitySelector',
        source: SOURCE,
      })}
    >
      <i className="fa-solid fa-minus text-xs" />
    </button>
    <span className="w-10 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
      {value}
    </span>
    <button
      type="button"
      onClick={onIncrement}
      disabled={value >= max}
      aria-label="Aumentar cantidad"
      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-500 hover:text-brand disabled:opacity-30 cursor-pointer"
      {...uiMeta({
        id: `${traceId}.mas`,
        component: 'QuantitySelector',
        source: SOURCE,
      })}
    >
      <i className="fa-solid fa-plus text-xs" />
    </button>
  </div>
)
