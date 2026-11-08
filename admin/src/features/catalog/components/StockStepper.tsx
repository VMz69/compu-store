import { tracer } from '@/ui-traceability'

const t = tracer('StockStepper', 'src/features/catalog/components/StockStepper.tsx')

const STEP_BUTTON =
  'w-5 h-5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-brand hover:text-white font-bold'

interface StockStepperProps {
  productId: string
  stock: number
  editable: boolean
  /** Con control de lotes el stock se deriva de los lotes y se edita desde la ficha. */
  lotControlled?: boolean
  onAdjust: (productId: string, delta: number) => void
}

/** Ajuste rápido de existencias (−/+). Solo lectura si el rol no puede o si el stock va por lotes. */
export function StockStepper({ productId, stock, editable, lotControlled = false, onAdjust }: StockStepperProps) {
  return (
    <div className="flex items-center gap-1.5" {...t(`catalog.card.stock.${productId}`)}>
      <span className="text-[10px] font-bold text-slate-500">Stock:</span>
      {editable ? (
        <>
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label="Restar una unidad"
            onClick={() => onAdjust(productId, -1)}
            {...t(`catalog.card.stock.decrement.${productId}`)}
          >
            -
          </button>
          <span className="font-bold text-slate-800 dark:text-slate-100 min-w-[20px] text-center">{stock}</span>
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label="Sumar una unidad"
            onClick={() => onAdjust(productId, 1)}
            {...t(`catalog.card.stock.increment.${productId}`)}
          >
            +
          </button>
        </>
      ) : (
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
          {stock}
          {lotControlled && (
            <i
              className="fa-solid fa-layer-group text-[10px] text-brand"
              title="Stock controlado por lotes: ajústalo desde la ficha del producto"
              aria-label="Controlado por lotes"
            />
          )}
        </span>
      )}
    </div>
  )
}
