import { PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { BranchBanner } from '../components/BranchBanner'
import { KpiGrid } from '../components/KpiGrid'
import { RecentOrdersPanel } from '../components/RecentOrdersPanel'
import { StockHealthPanel } from '../components/StockHealthPanel'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'

const t = tracer('DashboardPage', 'src/features/dashboard/pages/DashboardPage.tsx')

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
