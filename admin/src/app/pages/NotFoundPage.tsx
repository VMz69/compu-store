import { Link } from 'react-router-dom'
import { useHomePath } from '@/features/access'
import { EmptyState, PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('NotFoundPage', 'src/app/pages/NotFoundPage.tsx')

export function NotFoundPage() {
  const homePath = useHomePath()

  return (
    <PageContainer {...t('app.not-found')}>
      <EmptyState
        icon="fa-solid fa-compass"
        title="La vista solicitada no existe."
        hint="Revisa la dirección o vuelve a tu vista de inicio."
        action={
          <Link
            to={homePath}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-hover"
            {...t('app.not-found.home')}
          >
            <i className="fa-solid fa-house text-[10px]" aria-hidden="true" /> Ir al inicio
          </Link>
        }
      />
    </PageContainer>
  )
}
