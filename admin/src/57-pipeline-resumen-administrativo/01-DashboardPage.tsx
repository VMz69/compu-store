import { PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { BranchBanner } from './04-BranchBanner'
import { KpiGrid } from './03-KpiGrid'
import { RecentOrdersPanel } from '../58-pipeline-seguimiento-comercial/03-RecentOrdersPanel'
import { StockHealthPanel } from '../58-pipeline-seguimiento-comercial/04-StockHealthPanel'
import { useDashboardMetrics } from './02-useDashboardMetrics'

const t = tracer('DashboardPage', 'src/57-pipeline-resumen-administrativo/01-DashboardPage.tsx')

export function DashboardPage() {
  const d = useDashboardMetrics()

  return (
    <PageContainer padding="p-4 sm:p-6" {...t('dashboard')}>
      <BranchBanner
        title={d.branch.title}
        address={d.branch.address}
        schedule={d.branch.schedule}
        canCreateProduct={d.canCreateProduct}
        canRegisterOrder={d.canRegisterOrder}
        onCreateProduct={d.createProduct}
        onRegisterOrder={d.registerOrder}
      />
      <KpiGrid items={d.kpis} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RecentOrdersPanel orders={d.recentOrders} onSeeAll={d.seeAllOrders} />
        <StockHealthPanel health={d.health} onNavigate={d.goTo} />
      </div>
    </PageContainer>
  )
}
