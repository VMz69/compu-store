import { Card } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { PipelineApi } from '../../hooks/usePipeline'

const t = tracer('StatusPipeline', 'src/features/sales/components/pipeline/StatusPipeline.tsx')

type StatusPipelineProps = Pick<PipelineApi, 'steps' | 'cancel' | 'showOrders' | 'openDetail'>

/** Stepper interactivo: pasos secuenciales + rama terminal de cancelación. */
export function StatusPipeline({ steps, cancel, showOrders, openDetail }: StatusPipelineProps) {
  return (
    <Card className="p-4 overflow-x-auto hide-scrollbar" {...t('settings.pipeline')}>
      <div className="flex items-center justify-between min-w-[640px] gap-2">
        {steps.map(({ status, count }, index) => (
          <div key={status.id} className="flex-1 flex items-center">
            <div
              className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
              {...t(`settings.pipeline.step.${status.id}`)}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white text-[10px] font-black mb-1.5 shadow-2xs">
                {status.step}
              </span>
              <button
                type="button"
                title="Ver detalle del estado"
                className="w-full font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 hover:text-brand"
                onClick={() => openDetail(status.name)}
                {...t(`settings.pipeline.detail.${status.id}`)}
              >
                <i className={`fa-solid ${status.icon} text-[10px] text-brand`} aria-hidden="true" /> {status.name}
              </button>
              <span className="block text-[10px] text-slate-400 mt-0.5">{count} órdenes</span>
              <button
                type="button"
                className="mt-2 text-[10px] font-bold text-brand hover:underline inline-flex items-center gap-1"
                onClick={() => showOrders(status.name)}
                {...t(`settings.pipeline.orders.${status.id}`)}
              >
                Ver en Pedidos <i className="fa-solid fa-arrow-right text-[8px]" aria-hidden="true" />
              </button>
            </div>
            {index < steps.length - 1 && (
              <div className="px-2 text-slate-300 dark:text-slate-600 font-bold text-xs shrink-0">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}

        <div className="shrink-0 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div
            className="bg-red-50/70 dark:bg-red-950/20 p-3 rounded-xl border border-red-200 dark:border-red-900/50 text-center w-36"
            {...t('settings.pipeline.cancel')}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-black mb-1.5 shadow-2xs">
              ✕
            </span>
            <button
              type="button"
              title="Ver detalle del estado"
              className="w-full font-bold text-xs text-red-700 dark:text-red-400 flex items-center justify-center gap-1 hover:underline"
              onClick={() => openDetail(cancel.name)}
              {...t('settings.pipeline.cancel.detail')}
            >
              <i className={`fa-solid ${cancel.icon} text-[10px]`} aria-hidden="true" /> {cancel.name}
            </button>
            <span className="block text-[10px] text-red-500 dark:text-red-400 mt-0.5">{cancel.count} órdenes</span>
            <button
              type="button"
              className="mt-2 text-[10px] font-bold text-red-600 hover:underline inline-flex items-center gap-1"
              onClick={() => showOrders(cancel.name)}
              {...t('settings.pipeline.cancel.orders')}
            >
              Ver Cancelados <i className="fa-solid fa-arrow-right text-[8px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
