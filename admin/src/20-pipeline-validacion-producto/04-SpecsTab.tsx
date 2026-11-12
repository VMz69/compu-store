import { Field, Textarea } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductFormApi } from '../18-pipeline-edicion-producto/02-useProductForm'
import { SpecRowsEditor } from './05-SpecRowsEditor'

const t = tracer('SpecsTab', 'src/20-pipeline-validacion-producto/04-SpecsTab.tsx')

/** Sección 3 · Compatibilidad, conectividad y ficha técnica clave/valor. */
export function SpecsTab({ api }: { api: ProductFormApi }) {
  const { bind } = api.form

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Compatibilidad" variant="caps" hint="Sistemas, equipos o modelos con los que funciona.">
          <Textarea
            className="h-24"
            placeholder="Ej. Windows 11, macOS; placas M.2 2280 PCIe 3.0/4.0…"
            {...bind('compatibility')}
            {...t('catalog.product-form.compatibility')}
          />
        </Field>
        <Field label="Conectividad / Puertos" variant="caps" hint="Interfaces físicas e inalámbricas.">
          <Textarea
            className="h-24"
            placeholder="Ej. USB-C, HDMI 2.0, Bluetooth 5.0, Wi-Fi 6…"
            {...bind('connectivity')}
            {...t('catalog.product-form.connectivity')}
          />
        </Field>
      </div>
      <SpecRowsEditor api={api} />
    </div>
  )
}
