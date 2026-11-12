import { Button, Card } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useIdentityForm } from './05-useIdentityForm'
import { CommercialFields, InvoiceNumberingFields, TaxpayerFields } from './03-IdentityFields'
import { IdentityPreview } from './04-IdentityPreview'

const t = tracer('IdentityForm', 'src/61-pipeline-identidad-comercial/02-IdentityForm.tsx')

/** Identidad del emisor: formulario (2/3) + vista previa de cómo se imprime en los documentos (1/3). */
export function IdentityForm() {
  const f = useIdentityForm()

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start" {...t('settings.identity.layout')}>
      <Card className="p-5 xl:col-span-2" {...t('settings.identity')}>
        <form onSubmit={f.onSubmit} noValidate className="space-y-4" {...t('settings.identity.form')}>
          <fieldset disabled={!f.canEdit} className="space-y-4">
            <CommercialFields f={f} />
            <TaxpayerFields f={f} />
            <InvoiceNumberingFields f={f} />
          </fieldset>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">
              <i className="fa-solid fa-circle-info mr-1" aria-hidden="true" />
              Aplica a los próximos documentos; los ya emitidos conservan sus datos.
            </p>
            {f.canEdit ? (
              <Button type="submit" isLoading={f.isLoading} {...t('settings.identity.save')}>
                Guardar datos del emisor
              </Button>
            ) : (
              <span className="text-xs text-slate-400">Necesitas el permiso «Editar configuración» para modificar estos datos</span>
            )}
          </div>
        </form>
      </Card>
      <IdentityPreview preview={f.preview} />
    </div>
  )
}
