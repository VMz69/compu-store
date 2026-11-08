import { Button, Card, Field, Input, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useIdentityForm } from '../hooks/useIdentityForm'

const t = tracer('IdentityForm', 'src/features/settings/components/IdentityForm.tsx')

export function IdentityForm() {
  const { bind, canEdit, onSubmit, isLoading } = useIdentityForm()

  return (
    <Card className="p-5 max-w-3xl" {...t('settings.identity')}>
      <form onSubmit={onSubmit} className="space-y-4" {...t('settings.identity.form')}>
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre Comercial" variant="caps">
              <Input tone="muted" required {...bind('name')} {...t('settings.identity.name')} />
            </Field>
            <Field label="Correo Electrónico Institucional" variant="caps">
              <Input tone="muted" type="email" required {...bind('email')} {...t('settings.identity.email')} />
            </Field>
            <Field label="Teléfono Principal WhatsApp" variant="caps">
              <Input tone="muted" {...bind('phone')} {...t('settings.identity.phone')} />
            </Field>
            <Field label="Teléfono Fijo Sala de Ventas" variant="caps">
              <Input tone="muted" {...bind('phone2')} {...t('settings.identity.phone2')} />
            </Field>
          </div>
          <Field label="Dirección Física de la Sucursal" variant="caps">
            <Textarea tone="muted" className="h-20" {...bind('address')} {...t('settings.identity.address')} />
          </Field>
        </fieldset>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          {canEdit ? (
            <Button type="submit" isLoading={isLoading} {...t('settings.identity.save')}>
              Guardar Identidad
            </Button>
          ) : (
            <span className="text-xs text-slate-400">Sólo Superadmin puede modificar la identidad</span>
          )}
        </div>
      </form>
    </Card>
  )
}
