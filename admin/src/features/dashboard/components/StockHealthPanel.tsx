import { Card, CardTitle, ProgressBar, type ProgressTone } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { QuickLinks } from './QuickLinks'

const t = tracer('StockHealthPanel', 'src/features/dashboard/components/StockHealthPanel.tsx')

interface StockHealthPanelProps {
  health: Array<{ label: string; value: number; tone: ProgressTone }>
  onNavigate: (path: string) => void
}

/** Distribución de existencias + accesos rápidos. */
export function StockHealthPanel({ health, onNavigate }: StockHealthPanelProps) {
  return (
    <Card className="p-4 flex flex-col justify-between space-y-4" {...t('dashboard.stock-health')}>
      <div>
        <CardTitle className="mb-1">Distribución de Existencias</CardTitle>
        <p className="text-[10px] text-slate-400 mb-3">Balance de inventario físico en sala</p>
        <div className="space-y-2.5">
          {health.map((item) => (
            <ProgressBar key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </div>
      <QuickLinks onNavigate={onNavigate} />
    </Card>
  )
}
