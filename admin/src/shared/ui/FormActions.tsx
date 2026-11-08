import { Button } from './Button'

interface FormActionsProps {
  onCancel: () => void
  submitLabel: string
  isLoading?: boolean
  cancelMeta?: Record<string, string>
  submitMeta?: Record<string, string>
}

/** Pie estándar de formularios en modal: Cancelar + Guardar (submit). */
export function FormActions({
  onCancel,
  submitLabel,
  isLoading = false,
  cancelMeta,
  submitMeta,
}: FormActionsProps) {
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
      <Button variant="outline" size="md" onClick={onCancel} {...cancelMeta}>
        Cancelar
      </Button>
      <Button type="submit" size="md" isLoading={isLoading} {...submitMeta}>
        {submitLabel}
      </Button>
    </div>
  )
}
