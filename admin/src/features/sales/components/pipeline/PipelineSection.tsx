import { CardTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { usePipeline } from '../../hooks/usePipeline'
import { StatusCriteriaTable } from './StatusCriteriaTable'
import { StatusPipeline } from './StatusPipeline'

const t = tracer('PipelineSection', 'src/features/sales/components/pipeline/PipelineSection.tsx')

/** Sección "Pipeline de Transición Operativa" de Ajustes › Canales & Transiciones. */
export function PipelineSection() {
  const { steps, cancel, criteria, showOrders, openDetail } = usePipeline()

  return (
    <section className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800" {...t('settings.pipeline-section')}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <CardTitle className="flex items-center gap-2">
            <i className="fa-solid fa-arrows-split-up-and-left text-brand" aria-hidden="true" /> Flujo general de
            pedidos
          </CardTitle>
          <p className="text-[11px] text-slate-400">
            Registrado → Confirmado y Listo → Facturado → Entregado. Cada paso tiene efectos sobre inventario,
            facturación, clientes y cotizaciones; las acciones de Pedidos solo ofrecen las transiciones permitidas.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <i className="fa-solid fa-link text-brand text-[10px]" aria-hidden="true" /> Sincronizado reactivamente
          con Pedidos
        </div>
      </div>

      <StatusPipeline steps={steps} cancel={cancel} showOrders={showOrders} openDetail={openDetail} />
      <StatusCriteriaTable criteria={criteria} showOrders={showOrders} openDetail={openDetail} />
    </section>
  )
}
