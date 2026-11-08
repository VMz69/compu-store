import { Button, PageContainer, PageHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { PromotionCard } from '../components/PromotionCard'
import { usePromotions } from '../hooks/usePromotions'

const t = tracer('PromotionsPage', 'src/features/promotions/pages/PromotionsPage.tsx')

export function PromotionsPage() {
  const { promotions, canCreate, showItems, openCreate } = usePromotions()

  return (
    <PageContainer {...t('promotions')}>
      <PageHeader
        title="Promociones & Banners Principales"
        subtitle="Control de las campañas destacadas en el Front Office"
        action={
          canCreate && (
            <Button icon="fa-solid fa-tag" onClick={openCreate} {...t('promotions.create')}>
              Nueva Promoción
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" {...t('promotions.grid')}>
        {promotions.map((promotion) => (
          <PromotionCard key={promotion.id} promotion={promotion} onShowItems={showItems} />
        ))}
      </div>
    </PageContainer>
  )
}
