import { Button, Card, CardTitle } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'

const t = tracer('BackupCard', 'src/63-pipeline-mantenimiento-datos/04-BackupCard.tsx')

interface BackupCardProps {
  summary: string[]
  onExport: () => void
}

export function BackupCard({ summary, onExport }: BackupCardProps) {
  return (
    <Card className="p-5 space-y-3.5 flex flex-col justify-between" {...t('settings.backup')}>
      <div>
        <CardTitle className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-download text-brand" aria-hidden="true" /> Respaldo Completo (Snapshot JSON)
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          Exporta una copia de seguridad en formato JSON estructurado que incluye todos los productos, órdenes,
          canales configurados, categorías y ajustes vigentes.
        </p>
        <ul className="text-[11px] font-bold text-slate-600 dark:text-slate-300 space-y-1">
          {summary.map((line) => (
            <li key={line}>
              <i className="fa-solid fa-check text-emerald-500 mr-1" aria-hidden="true" /> {line}
            </li>
          ))}
        </ul>
      </div>
      <Button icon="fa-solid fa-file-arrow-down" className="w-full" onClick={onExport} {...t('settings.backup.export')}>
        Descargar Snapshot JSON
      </Button>
    </Card>
  )
}
