import { cn } from '@/shared/lib/cn'
import { Field, FormActions, Input, Modal, ModalHeader, ModalTitle, Textarea } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useCategoryForm } from '../../hooks/useCategoryForm'

const t = tracer('CategoryFormModal', 'src/features/catalog/components/taxonomy/CategoryFormModal.tsx')

/** Alta/edición de categoría con selector visual de ícono y vista previa. */
export function CategoryFormModal() {
  const f = useCategoryForm()

  return (
    <Modal onClose={f.onClose} widthClass="w-[min(94vw,500px)]" {...t('catalog.category-form')}>
      <ModalHeader onClose={f.onClose} closeMeta={t('catalog.category-form.close')}>
        <ModalTitle icon={f.isEdit ? 'fa-solid fa-pen' : 'fa-solid fa-folder-plus'}>{f.isEdit ? 'Editar categoría' : 'Nueva categoría'}</ModalTitle>
      </ModalHeader>

      <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-4 text-xs" {...t('catalog.category-form.form')}>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800" aria-live="polite">
          <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-xl shrink-0">
            <i className={f.values.icon} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{f.values.name.trim() || 'Nombre de la categoría'}</p>
            <p className="text-[10px] text-slate-400 font-mono">{f.slug ? `/${f.slug} · fijo (URL del Front Office)` : 'El slug se genera al guardar'}</p>
          </div>
        </div>

        <Field label="Nombre" variant="caps" required error={f.errors.name}>
          <Input autoFocus maxLength={40} placeholder="Ej. Redes & Conectividad" invalid={Boolean(f.errors.name)} {...f.bind('name')} {...t('catalog.category-form.name')} />
        </Field>

        <fieldset>
          <legend className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ícono</legend>
          <div className="grid grid-cols-10 gap-1.5" role="radiogroup" aria-label="Ícono de la categoría">
            {f.icons.map((icon) => {
              const selected = f.values.icon === icon
              return (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={icon.replace('fa-solid fa-', '')}
                  onClick={() => f.selectIcon(icon)}
                  className={cn(
                    'aspect-square rounded-lg border flex items-center justify-center text-sm transition-colors',
                    selected ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand/50 hover:text-brand',
                  )}
                  {...t(`catalog.category-form.icon.${icon.replace('fa-solid fa-', '')}`)}
                >
                  <i className={icon} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </fieldset>

        <Field label="Descripción" variant="caps" hint="Opcional · se muestra en el Front Office" error={f.errors.description}>
          <Textarea maxLength={160} placeholder="Routers, switches, antenas y cables de red…" invalid={Boolean(f.errors.description)} {...f.bind('description')} {...t('catalog.category-form.description')} />
        </Field>

        <FormActions
          onCancel={f.onClose}
          submitLabel={f.isEdit ? 'Guardar cambios' : 'Crear categoría'}
          isLoading={f.isLoading}
          cancelMeta={t('catalog.category-form.cancel')}
          submitMeta={t('catalog.category-form.submit')}
        />
      </form>
    </Modal>
  )
}
